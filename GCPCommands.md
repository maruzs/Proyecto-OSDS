# Comandos GCP para el proyecto

Este documento detalla los comandos necesarios para configurar la red, el firewall y crear las **3 Máquinas Virtuales (VMs)** con **Ubuntu Server 22.04 LTS** en Google Cloud Platform, respetando la arquitectura distribuida del proyecto.

## 1. Configuración de Variables de Entorno

Ejecuta esto en Cloud Shell para definir las variables iniciales:

```bash
# Definición de variables de entorno
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
ZONE="us-central1-a"
NETWORK_NAME="salud-vpc"
SUBNET_NAME="salud-subnet"
SUBNET_RANGE="10.128.0.0/24"
```

---

## 2. Habilitar la API de Compute Engine

```bash
gcloud services enable compute.googleapis.com --project=$PROJECT_ID
```

---

## 3. Configuración de Red VPC y Subredes

Para poder asignar IPs internas específicas (`10.128.0.10`, `10.128.0.20`, `10.128.0.30`), crearemos una red VPC personalizada:

```bash
# Crear la Red VPC personalizada (sin subredes automáticas)
gcloud compute networks create $NETWORK_NAME \
    --project=$PROJECT_ID \
    --subnet-mode=custom

# Crear la subred para nuestras VMs
gcloud compute networks subnets create $SUBNET_NAME \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --region=$REGION \
    --range=$SUBNET_RANGE
```

---

## 4. Reglas de Firewall

Necesitamos crear dos reglas de firewall: una para permitir la comunicación interna entre las VMs de la red, y otra para permitir el tráfico público (HTTP/HTTPS/SSH) a la VM del Gateway.

```bash
# 1. Permitir comunicación interna completa entre las VMs de la VPC (para replicación de BD y proxies)
gcloud compute firewall-rules create allow-internal-salud \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --allow tcp,udp,icmp \
    --source-ranges=$SUBNET_RANGE \
    --description="Permitir trafico interno entre todas las VMs de la red"

# 2. Permitir tráfico HTTP (80) y HTTPS (443) entrante a internet (aplicable a la VM 3 / Gateway)
gcloud compute firewall-rules create allow-http-https \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --allow tcp:80,tcp:443 \
    --target-tags=http-server,https-server \
    --description="Permitir trafico HTTP y HTTPS desde el exterior"

# 3. Permitir conexión SSH (22) desde cualquier lugar a las VMs
gcloud compute firewall-rules create allow-ssh \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --allow tcp:22 \
    --description="Permitir acceso SSH"
```

---

## 5. Creación de las 3 Máquinas Virtuales (Ubuntu 22.04 LTS + Docker + Compose V2)

Ejecuta estos comandos para aprovisionar las 3 VMs con sus IPs estáticas respectivas. Todas vienen con un script de inicio (`startup-script`) para instalar Docker y Docker Compose V2 automáticamente.

### VM 1: Hospital Local (`vm-hospital-local`)

- **IP Interna:** `10.128.0.10`
- **Servicios:** `app-estaciones` (puerto 8001), `db-local` (puerto 5432)

```bash
gcloud compute instances create vm-hospital-local \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --network=$NETWORK_NAME \
    --subnet=$SUBNET_NAME \
    --private-network-ip=10.128.0.10 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose"
```

### VM 2: Nube Central (`vm-nube-central`)

- **IP Interna:** `10.128.0.20`
- **Servicios:** `app-terminales` (puerto 8002), `db-nube` (puerto 5432)

```bash
gcloud compute instances create vm-nube-central \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --network=$NETWORK_NAME \
    --subnet=$SUBNET_NAME \
    --private-network-ip=10.128.0.20 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose"
```

### VM 3: Gateway (`vm-gateway`)

- **IP Interna:** `10.128.0.30`
- **Servicios:** `nginx-proxy` (puerto 80/443), Frontend (`index.html`)

```bash
gcloud compute instances create vm-gateway \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --network=$NETWORK_NAME \
    --subnet=$SUBNET_NAME \
    --private-network-ip=10.128.0.30 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --tags=http-server,https-server \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose"
```

---

## 6. Conexión SSH

Para entrar a cualquiera de las VMs, usa:

```bash
gcloud compute ssh vm-hospital-local --zone=us-central1-a
gcloud compute ssh vm-nube-central --zone=us-central1-a
gcloud compute ssh vm-gateway --zone=us-central1-a
```

## Solución al Error de Docker Compose (Si la VM ya está creada)

Si ya tienes la VM corriendo y obtuviste el error de versión no soportada, ejecuta esto **dentro de la VM** por SSH para actualizar a la versión V2:

```bash
# Descargar Docker Compose V2 e instalarlo sobreescribiendo el viejo
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose

# Verificar la versión (debe mostrar v2.x.x)
docker-compose version

# Levantar de nuevo la infraestructura
sudo docker-compose up --build -d
```

## Resultados importantes

```bash
# Firewall
NAME: allow-http-https
NETWORK: default
DIRECTION: INGRESS
PRIORITY: 1000
ALLOW: tcp:80,tcp:443
DENY:
DISABLED: False

# VM
NAME: salud-distribuida-vm
ZONE: us-central1-a
MACHINE_TYPE: e2-medium
PREEMPTIBLE:
INTERNAL_IP: 10.128.0.2
EXTERNAL_IP: 34.123.130.77
STATUS: RUNNING

# Conexion mediante SSH
Waiting for SSH key to propagate.
Warning: Permanently added 'compute.424838007372744023' (ED25519) to the list of known hosts.
Linux salud-distribuida-vm 5.10.0-43-cloud-amd64 #1 SMP Debian 5.10.251-5 (2026-05-15) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
```

## Conexión SSH y Despliegue en GCP

```bash
# Clonar repositorio
git clone https://github.com/maruzs/Proyecto-OSDS.git Proyecto-OSDS
cd Proyecto-OSDS
git checkout mariano # O cualquier rama en la que estemos

# Descargar Docker Compose V2 de los repositorios oficiales de Docker y sobreescribir el viejo
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/bin/docker-compose

# Darle permisos de ejecución al binario
sudo chmod +x /usr/bin/docker-compose

# Levantar la infraestructura en segundo plano con Docker Compose
sudo docker-compose up --build -d

# Salir de la terminal de la VM y volver a Cloud Shell
exit
```

## GCP

```bash
marianoemunozr@salud-distribuida-vm:~/Proyecto-OSDS$ exit
logout
Connection to 34.123.130.77 closed.
marianoemunozr@cloudshell:~ (os-ds-498615)$ gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
34.123.130.77
```

## FUNCIONAMIENTO GENERAL PARA USUARIOS

```bash
# Encender VMs (Ideal que enciendan solo la que van a usar para no gastar tanto)
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a

# Ingresar mediante ssh (selecciona la que necesites administrar)
gcloud compute ssh vm-hospital-local --zone=us-central1-a
gcloud compute ssh vm-nube-central --zone=us-central1-a
gcloud compute ssh vm-gateway --zone=us-central1-a

# Apagar VMs (fuera del SSH)
gcloud compute instances stop vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

## Funcionamiento VM3

```bash
# Deben iniciar la VM3 -> vm-gateway
# Una vez dentro deben hacer cd VM3 lo que llevara al codigo de la VM3
# Ahi hacen `sudo docker-compose up -d` para iniciar los servicios (no es necesario --build)
# Para poder ver y probar hay que ir al siguiente link osdsp3.epistia.cl ya que estoy usando un tunel de cloudflare con mi dominio para poder asegurar el HTTPS
```
