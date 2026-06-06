# Comandos GCP para el proyecto

## Comandos Iniciales

```bash
# Configuracion de variables de entorno
PROJECT_ID=$(gcloud config get-value project)
ZONE="us-central1-a"
VM_NAME="salud-distribuida-vm"

# Habilitar los servicios de GCP necesarios
gcloud services enable compute.googleapis.com

# Regla de firewall para permitir acceso a los puertos 80 y 443
gcloud compute firewall-rules create allow-http-https \
    --allow tcp:80,tcp:443 \
    --target-tags=http-server,https-server \
    --description="Permitir trafico HTTP y HTTPS entrante para el simulador"

# Crear la VM (Con Docker y Docker Compose V2)
gcloud compute instances create $VM_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --tags=http-server,https-server \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose"

# Conexion mediante SSH
gcloud compute ssh salud-distribuida-vm --zone=us-central1-a

```

## Solución al Error de Docker Compose (Si la VM ya está creada)

Si ya tienes la VM corriendo y obtuviste el error de versión no soportada (debido a que apt instala Docker Compose V1 en Debian 11), ejecuta esto **dentro de la VM** por SSH para actualizar a la versión V2:

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
# Encender VM
gcloud compute instances start salud-distribuida-vm --zone=us-central1-a

# Ingresar mediante ssh
gcloud compute ssh salud-distribuida-vm --zone=us-central1-a

# Apagar VM
gcloud compute instances stop salud-distribuida-vm --zone=us-central1-a

# Invitar nuevos usuarios (Reemplazar correo@gmail.com por el correo real)
gcloud projects add-iam-policy-binding os-ds-498615 \
    --member="user:correo@gmail.com" \
    --role="roles/editor"

```
