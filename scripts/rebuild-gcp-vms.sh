#!/bin/bash
# ==============================================================================
# Script de Reconstrucción de Infraestructura en GCP - Proyecto 3 OSDS
# ==============================================================================
# Este script contiene todos los comandos gcloud y bash necesarios para crear
# las 3 VMs en Google Cloud Platform, instalar Docker/Compose, clonar el
# repositorio con la nueva rama unificada, y levantar los contenedores.
#
# Ejecutar este script desde Google Cloud Shell.
# ==============================================================================

ZONE="us-central1-a"
MACHINE_TYPE="e2-micro" # Tipo de máquina micro (2 vCPU, 1 GB RAM) - Apto para Free Tier de GCP
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
DISK_SIZE="10GB"        # Tamaño mínimo de disco estándar de Ubuntu

# ------------------------------------------------------------------------------
# 1. CREACIÓN DE LAS MÁQUINAS VIRTUALES CON IPs PRIVADAS ESTÁTICAS
# ------------------------------------------------------------------------------
echo "🚀 Creando Máquinas Virtuales en GCP..."

# VM 1: Hospital Local (IP: 10.128.0.10)
gcloud compute instances create vm-hospital-local \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --private-network-ip=10.128.0.10 \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$DISK_SIZE \
    --metadata=startup-script='#!/bin/bash
    sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    '

# VM 2: Nube Central (IP: 10.128.0.20)
gcloud compute instances create vm-nube-central \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --private-network-ip=10.128.0.20 \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$DISK_SIZE \
    --metadata=startup-script='#!/bin/bash
    sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    '

# VM 3: Gateway de Seguridad (IP: 10.128.0.30)
gcloud compute instances create vm-gateway \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --private-network-ip=10.128.0.30 \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$DISK_SIZE \
    --metadata=startup-script='#!/bin/bash
    sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    '

echo "⏳ Esperando 30 segundos a que las VMs terminen de inicializarse e instalar Docker..."
sleep 30

# ------------------------------------------------------------------------------
# 2. CONFIGURACIÓN DEL CÓDIGO E INICIALIZACIÓN EN CADA VM
# ------------------------------------------------------------------------------
echo "⚙️ Clonando repositorio y configurando servicios..."

# Define tu URL de repositorio Git
REPO_URL="https://github.com/maruzs/Proyecto-OSDS.git" # Ajustar si es necesario
BRANCH="parte3/general"

# Configurar VM 1 (Hospital Local)
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="
  git clone $REPO_URL ~/Proyecto-OSDS || (cd ~/Proyecto-OSDS && git fetch origin)
  cd ~/Proyecto-OSDS
  git checkout $BRANCH
  git pull origin $BRANCH
"

# Configurar VM 2 (Nube Central)
gcloud compute ssh vm-nube-central --zone=$ZONE --command="
  git clone $REPO_URL ~/Proyecto-OSDS || (cd ~/Proyecto-OSDS && git fetch origin)
  cd ~/Proyecto-OSDS
  git checkout $BRANCH
  git pull origin $BRANCH
"

# Configurar VM 3 (Gateway / Nginx)
gcloud compute ssh vm-gateway --zone=$ZONE --command="
  git clone $REPO_URL ~/Proyecto-OSDS || (cd ~/Proyecto-OSDS && git fetch origin)
  cd ~/Proyecto-OSDS
  git checkout $BRANCH
  git pull origin $BRANCH
"

# ------------------------------------------------------------------------------
# 3. DESPLIEGUE DE CONTENEDORES
# ------------------------------------------------------------------------------
echo "🐳 Desplegando contenedores en cada nodo..."

# Desplegar VM 1 (Hospital)
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="
  cd ~/Proyecto-OSDS/vms/vm1-hospital
  sudo docker-compose down --remove-orphans
  sudo docker-compose up --build -d
  sleep 5
  sudo docker exec -it db-local psql -U postgres -d clinica -c 'ALTER TABLE fichas_pacientes REPLICA IDENTITY FULL;'
"

# Desplegar VM 2 (Nube)
gcloud compute ssh vm-nube-central --zone=$ZONE --command="
  cd ~/Proyecto-OSDS/vms/vm2-nube
  sudo docker-compose down --remove-orphans
  sudo docker-compose up --build -d
  sleep 5
  sudo docker exec -it db-nube psql -U postgres -d clinica -c 'ALTER TABLE fichas_pacientes REPLICA IDENTITY FULL;'
"

# Desplegar VM 3 (Gateway) - NOTA: Reemplazar TUNNEL_TOKEN en Cloudflare Tunnel si cambia
gcloud compute ssh vm-gateway --zone=$ZONE --command="
  cd ~/Proyecto-OSDS/vms/vm3-gateway
  sudo docker-compose down --remove-orphans
  # Se asume que el token está configurado en .env o se pasa como variable
  sudo docker-compose up -d
"

echo "✅ Infraestructura desplegada exitosamente."
echo "🔗 Recuerda configurar la replicación lógica bidireccional una vez que todo esté activo."
