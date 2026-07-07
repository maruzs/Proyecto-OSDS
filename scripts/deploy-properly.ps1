Write-Host "Sincronizando cambios locales con las VMs de GCP usando Tar..."

$ZONE="us-central1-a"
$TARGET_DIR="/home/marianoemunozr/Proyecto-OSDS"

# 1. Comprimir las aplicaciones excluyendo node_modules
Write-Host "Creando archivos tar..."
tar --exclude="node_modules" -czf estaciones-medicas.tar.gz -C apps estaciones-medicas
tar --exclude="node_modules" -czf app-bodega.tar.gz -C apps app-bodega
tar --exclude="node_modules" -czf middleware.tar.gz -C apps middleware

# VM1: Hospital Local
Write-Host "Desplegando en vm-hospital-local..."
gcloud compute scp estaciones-medicas.tar.gz vm-hospital-local:/tmp/ --zone=$ZONE --quiet
gcloud compute scp --recurse vms/vm1-hospital vm-hospital-local:/tmp/ --zone=$ZONE --quiet
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="
  sudo rm -rf $TARGET_DIR/apps/estaciones-medicas
  sudo mkdir -p $TARGET_DIR/apps
  sudo tar -xzf /tmp/estaciones-medicas.tar.gz -C $TARGET_DIR/apps/
  sudo cp -rf /tmp/vm1-hospital $TARGET_DIR/vms/
  sudo rm -f /tmp/estaciones-medicas.tar.gz
  sudo rm -rf /tmp/vm1-hospital
  sudo chown -R marianoemunozr:marianoemunozr $TARGET_DIR
  sudo bash -c 'cd $TARGET_DIR/vms/vm1-hospital && docker compose down -v && docker compose up -d --build'
" --quiet

# VM3: Gateway & Central Services
Write-Host "Desplegando en vm-gateway..."
gcloud compute scp app-bodega.tar.gz vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp middleware.tar.gz vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp --recurse vms/vm3-gateway vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute ssh vm-gateway --zone=$ZONE --command="
  sudo rm -rf $TARGET_DIR/apps/app-bodega $TARGET_DIR/apps/middleware
  sudo mkdir -p $TARGET_DIR/apps
  sudo tar -xzf /tmp/app-bodega.tar.gz -C $TARGET_DIR/apps/
  sudo tar -xzf /tmp/middleware.tar.gz -C $TARGET_DIR/apps/
  sudo cp -rf /tmp/vm3-gateway $TARGET_DIR/vms/
  sudo rm -f /tmp/app-bodega.tar.gz /tmp/middleware.tar.gz
  sudo rm -rf /tmp/vm3-gateway
  sudo chown -R marianoemunozr:marianoemunozr $TARGET_DIR
  sudo bash -c 'cd $TARGET_DIR/vms/vm3-gateway && docker compose down -v && docker compose up -d --build'
" --quiet

# Limpiar archivos temporales locales
Write-Host "Limpiando archivos temporales locales..."
Remove-Item estaciones-medicas.tar.gz
Remove-Item app-bodega.tar.gz
Remove-Item middleware.tar.gz

Write-Host "Despliegue completado exitosamente con Tar."
