Write-Host "[BUILD] Construyendo imagen de Estaciones Medicas en vm-gateway..."
gcloud compute ssh vm-gateway --zone=us-central1-a --command="
  sudo docker build -t app-estaciones:latest /home/marianoemunozr/Proyecto-OSDS/apps/estaciones-medicas
  sudo docker save -o /tmp/app-estaciones.tar app-estaciones:latest
  sudo chmod 666 /tmp/app-estaciones.tar
" --quiet

Write-Host "[TRANSFER] Descargando imagen a local..."
gcloud compute scp vm-gateway:/tmp/app-estaciones.tar ./app-estaciones.tar --zone=us-central1-a --quiet

Write-Host "[SYNC] Sincronizando cambios locales con las VMs de GCP..."
$ZONE="us-central1-a"
$TARGET_DIR="/home/marianoemunozr/Proyecto-OSDS"

# VM1: Hospital Local
Write-Host "[VM1] Desplegando en vm-hospital-local..."
gcloud compute scp app-estaciones.tar vm-hospital-local:/tmp/ --zone=$ZONE --quiet
gcloud compute scp --recurse vms/vm1-hospital vm-hospital-local:/tmp/ --zone=$ZONE --quiet
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="
  sudo docker load -i /tmp/app-estaciones.tar
  sudo cp -rf /tmp/vm1-hospital $TARGET_DIR/vms/
  sudo rm -rf /tmp/vm1-hospital /tmp/app-estaciones.tar
  sudo chown -R marianoemunozr:marianoemunozr $TARGET_DIR
  sudo bash -c 'cd $TARGET_DIR/vms/vm1-hospital && docker compose down -v && docker compose up -d'
" --quiet

# VM3: Gateway & Central Services
Write-Host "[VM3] Desplegando en vm-gateway..."
gcloud compute scp --recurse apps/app-bodega vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp --recurse apps/middleware vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp --recurse vms/vm3-gateway vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute ssh vm-gateway --zone=$ZONE --command="
  sudo cp -rf /tmp/app-bodega $TARGET_DIR/apps/
  sudo cp -rf /tmp/middleware $TARGET_DIR/apps/
  sudo cp -rf /tmp/vm3-gateway $TARGET_DIR/vms/
  sudo rm -rf /tmp/app-bodega /tmp/middleware /tmp/vm3-gateway /tmp/app-estaciones.tar
  sudo chown -R marianoemunozr:marianoemunozr $TARGET_DIR
  sudo bash -c 'cd $TARGET_DIR/vms/vm3-gateway && docker compose down -v && docker compose up -d --build'
" --quiet

# Limpieza local
Remove-Item -Path app-estaciones.tar -Force -ErrorAction SilentlyContinue

Write-Host "[SUCCESS] Despliegue completado exitosamente."
