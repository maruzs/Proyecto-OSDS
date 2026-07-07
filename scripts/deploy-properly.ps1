Write-Host "Sincronizando cambios locales con las VMs de GCP usando Tar..."

$ZONE="us-central1-a"
$TARGET_DIR="/home/marianoemunozr/Proyecto-OSDS"

# 1. Comprimir las aplicaciones excluyendo node_modules
Write-Host "Creando archivos tar..."
tar --exclude="node_modules" -czf estaciones-medicas.tar.gz -C apps estaciones-medicas
tar --exclude="node_modules" -czf app-bodega.tar.gz -C apps app-bodega
tar --exclude="node_modules" -czf middleware.tar.gz -C apps middleware
tar -czf frontend.tar.gz -C apps frontend

# VM3: Gateway & Central Services (Tiene Internet)
Write-Host "Desplegando en vm-gateway..."
gcloud compute scp estaciones-medicas.tar.gz vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp app-bodega.tar.gz vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp middleware.tar.gz vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp frontend.tar.gz vm-gateway:/tmp/ --zone=$ZONE --quiet
gcloud compute scp --recurse vms/vm3-gateway vm-gateway:/tmp/ --zone=$ZONE --quiet

$cmd_gateway = @"
  sudo rm -rf $TARGET_DIR/apps/estaciones-medicas $TARGET_DIR/apps/app-bodega $TARGET_DIR/apps/middleware $TARGET_DIR/apps/frontend
  sudo mkdir -p $TARGET_DIR/apps
  sudo tar -xzf /tmp/estaciones-medicas.tar.gz -C $TARGET_DIR/apps/
  sudo tar -xzf /tmp/app-bodega.tar.gz -C $TARGET_DIR/apps/
  sudo tar -xzf /tmp/middleware.tar.gz -C $TARGET_DIR/apps/
  sudo tar -xzf /tmp/frontend.tar.gz -C $TARGET_DIR/apps/
  sudo cp -rf /tmp/vm3-gateway $TARGET_DIR/vms/
  sudo rm -f /tmp/estaciones-medicas.tar.gz /tmp/app-bodega.tar.gz /tmp/middleware.tar.gz /tmp/frontend.tar.gz
  sudo rm -rf /tmp/vm3-gateway

  # Construir imagen de Estaciones Medicas en el gateway que tiene acceso a internet
  sudo docker build -t app-estaciones:latest $TARGET_DIR/apps/estaciones-medicas
  sudo docker save app-estaciones:latest | gzip > /tmp/app-estaciones.tar.gz
  sudo chmod 666 /tmp/app-estaciones.tar.gz

  sudo chown -R marianoemunozr:marianoemunozr $TARGET_DIR
  sudo bash -c 'cd $TARGET_DIR/vms/vm3-gateway && docker compose down -v && docker compose up -d --build'
"@.Replace("`r", "")

gcloud compute ssh vm-gateway --zone=$ZONE --command=$cmd_gateway --quiet

# Descargar imagen a local
Write-Host "Descargando imagen construida desde vm-gateway (comprimida)..."
gcloud compute scp vm-gateway:/tmp/app-estaciones.tar.gz ./app-estaciones.tar.gz --zone=$ZONE --quiet

# VM1: Hospital Local (No tiene Internet)
Write-Host "Desplegando en vm-hospital-local..."
gcloud compute scp app-estaciones.tar.gz vm-hospital-local:/tmp/ --zone=$ZONE --quiet
gcloud compute scp --recurse vms/vm1-hospital vm-hospital-local:/tmp/ --zone=$ZONE --quiet

$cmd_local = @"
  sudo gunzip -c /tmp/app-estaciones.tar.gz | sudo docker load
  sudo cp -rf /tmp/vm1-hospital $TARGET_DIR/vms/
  sudo rm -rf /tmp/vm1-hospital /tmp/app-estaciones.tar.gz
  sudo chown -R marianoemunozr:marianoemunozr $TARGET_DIR
  sudo bash -c 'cd $TARGET_DIR/vms/vm1-hospital && docker compose down -v && docker compose up -d'
"@.Replace("`r", "")

gcloud compute ssh vm-hospital-local --zone=$ZONE --command=$cmd_local --quiet

# Limpiar archivos temporales locales
Write-Host "Limpiando archivos temporales locales..."
Remove-Item estaciones-medicas.tar.gz -Force -ErrorAction SilentlyContinue
Remove-Item app-bodega.tar.gz -Force -ErrorAction SilentlyContinue
Remove-Item middleware.tar.gz -Force -ErrorAction SilentlyContinue
Remove-Item frontend.tar.gz -Force -ErrorAction SilentlyContinue
Remove-Item app-estaciones.tar.gz -Force -ErrorAction SilentlyContinue

Write-Host "Despliegue completado exitosamente."
