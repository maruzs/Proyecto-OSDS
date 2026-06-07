## Guía de Despliegue en Google Cloud Platform (GCP) con Cloud Shell

Esta guía permite realizar el despliegue completo de la infraestructura en una máquina virtual de Compute Engine utilizando únicamente comandos de terminal (`gcloud` CLI y SSH) en **Cloud Shell**.

### Paso 1: Configurar el Entorno del Proyecto
1. Abrir **Cloud Shell** en la consola de GCP.
2. Definir variables de entorno necesarias:
   ```bash
   PROJECT_ID=$(gcloud config get-value project)
   ZONE="us-central1-a"
   VM_NAME="salud-distribuida-vm"
   ```

### Paso 2: Habilitar las APIs Necesarias
Asegurar que la API de Compute Engine está habilitada:
```bash
gcloud services enable compute.googleapis.com
```

### Paso 3: Crear una Regla de Firewall para HTTP y HTTPS
Permitir el tráfico web entrante en los puertos 80 y 443 al proxy Nginx:
```bash
gcloud compute firewall-rules create allow-http-https \
    --allow tcp:80,tcp:443 \
    --target-tags=http-server,https-server \
    --description="Permitir trafico HTTP/S entrante"
```

### Paso 4: Crear la Instancia de VM en Compute Engine
Crear una máquina virtual pequeña (e.g., e2-medium) con el tag de red para HTTP/S:
```bash
gcloud compute instances create $VM_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --tags=http-server,https-server \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io docker-compose git"
```
*(Nota: El script de inicio instalará Docker y Docker Compose automáticamente).*

### Paso 5: Desplegar el Proyecto Mediante SSH
1. Conectarse a la máquina virtual usando SSH directamente desde Cloud Shell:
   ```bash
   gcloud compute ssh $VM_NAME --zone=$ZONE
   ```
2. Dentro de la VM, verificar que Docker esté corriendo:
   ```bash
   sudo systemctl status docker
   # Si Docker Compose no esta listo, esperar unos segundos o instalarlo manualmente:
   # sudo apt install -y docker-compose
   ```
3. Clonar tu repositorio del proyecto (o subir los archivos desde local):
   ```bash
   git clone <URL_DE_TU_REPOSITORIO> Proyecto-OSDS
   cd Proyecto-OSDS
   ```
4. Levantar la infraestructura en segundo plano con Docker Compose:
   ```bash
   sudo docker-compose up --build -d
   ```
5. Salir de la sesión SSH:
   ```bash
   exit
   ```

### Paso 6: Obtener la IP Pública y Probar
Obtener la dirección IP externa de la máquina virtual para probar el frontend en el navegador:
```bash
gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
```
Copia esa IP e ingresa en tu navegador para ver la interfaz interactiva.
