#!/bin/bash
# ==============================================================================
# Script de Reconstrucción de Infraestructura en GCP - Proyecto 3 OSDS
# ==============================================================================
# Este script recrea las 3 VMs en GCP, instala Docker/Compose en cada una,
# clona la rama parte3/general y levanta los servicios correspondientes a la
# arquitectura multi-base de datos con tolerancia a fallos.
#
# Ejecutar este script desde GCP Cloud Shell.
# ==============================================================================

ZONE="us-central1-a"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
DISK_SIZE="10GB"

# ------------------------------------------------------------------------------
# 1. ELIMINACIÓN DE VMs ANTERIORES (SI EXISTEN)
# ------------------------------------------------------------------------------
echo "🗑️ Eliminando VMs existentes si las hay..."
gcloud compute instances delete vm-hospital-local vm-nube-central vm-gateway --zone=$ZONE --quiet 2>/dev/null || true

# ------------------------------------------------------------------------------
# 2. CREACIÓN DE LAS MÁQUINAS VIRTUALES
# ------------------------------------------------------------------------------
echo "🚀 Creando Máquinas Virtuales en GCP..."

# VM 1: Hospital Local (MariaDB) - e2-micro es suficiente
gcloud compute instances create vm-hospital-local \
    --zone=$ZONE \
    --machine-type=e2-micro \
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

# VM 2: Nube Central (PostgreSQL en Python) - e2-micro
gcloud compute instances create vm-nube-central \
    --zone=$ZONE \
    --machine-type=e2-micro \
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

# VM 3: Gateway & Central Services - Requiere e2-medium (4 GB RAM) por carga de contenedores y bases MySQL
gcloud compute instances create vm-gateway \
    --zone=$ZONE \
    --machine-type=e2-medium \
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

echo "⏳ Esperando 45 segundos a que las VMs completen su inicialización e instalación de Docker..."
sleep 45

# ------------------------------------------------------------------------------
# 3. DESPLIEGUE DEL REPOSITORIO Y SERVICIOS
# ------------------------------------------------------------------------------
echo "⚙️ Configurando servicios en cada una de las VMs..."

BRANCH="parte3/general"
REPO="https://github.com/maruzs/Proyecto-OSDS.git"

# Desplegar VM 1 (Hospital Local)
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="
  sudo rm -rf ~/Proyecto-OSDS
  git clone $REPO ~/Proyecto-OSDS
  cd ~/Proyecto-OSDS && git checkout $BRANCH
  cd vms/vm1-hospital
  sudo docker compose up -d
"

# Desplegar VM 2 (Nube Central)
gcloud compute ssh vm-nube-central --zone=$ZONE --command="
  sudo rm -rf ~/Proyecto-OSDS
  git clone $REPO ~/Proyecto-OSDS
  cd ~/Proyecto-OSDS && git checkout $BRANCH
  cd vms/vm2-nube
  sudo docker compose up -d
"

# Desplegar VM 3 (Gateway / Middleware)
# Nota: Escribe el token por defecto provisto por el usuario
TOKEN="eyJhIjoiZjFhOTc0NWIzMDA1OTZjMjY2OTE0YzE2NDJlNDIwNDAiLCJ0IjoiN2I5YTQ1YzktMTBlMS00YjQ5LWIxMDctNjNjZTc3OTBiOTNhIiwicyI6Ik1HSTRPRFJtWkRVdE0yWmlZaTAwWkRkbExUZzBOalF0WkROaVpUYzFZMkZpTmpGbCJ9"
gcloud compute ssh vm-gateway --zone=$ZONE --command="
  sudo rm -rf ~/Proyecto-OSDS
  git clone $REPO ~/Proyecto-OSDS
  cd ~/Proyecto-OSDS && git checkout $BRANCH
  echo 'TUNNEL_TOKEN=$TOKEN' > ~/Proyecto-OSDS/vms/vm3-gateway/.env
  cd vms/vm3-gateway
  sudo docker compose up -d
"

echo "✅ Sistema recreado y desplegado exitosamente en su totalidad."
