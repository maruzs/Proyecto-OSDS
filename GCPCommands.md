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

# Crear la VM
gcloud compute instances create $VM_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --tags=http-server,https-server \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io docker-compose git"
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

# SSH
Waiting for SSH key to propagate.
Warning: Permanently added 'compute.424838007372744023' (ED25519) to the list of known hosts.
Linux salud-distribuida-vm 5.10.0-43-cloud-amd64 #1 SMP Debian 5.10.251-5 (2026-05-15) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
```
