# Documento de Handover (Traspaso) - Proyecto OSDS

Este documento sirve como guía para continuar el desarrollo del proyecto en otra máquina con Antigravity.

---

## Actual del Proyecto

Se ha completado el rol del **Integrante 4 (Seguridad y QA)**:

1. **Proxy Inverso (Nginx)**: Gateway configurado en [nginx.conf](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/config/nginx/nginx.conf) que enruta WebSockets `/ws-medicas` y `/ws-administrativas` a sus respectivos backends, y sirve el frontend en el puerto `80`.
2. **Orquestación**: Integrado el servicio `nginx-proxy` en [docker-compose.yml](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/docker-compose.yml).
3. **Frontend de Simulación**: Implementado en [apps/frontend/index.html](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/apps/frontend/index.html).

---

## 📂 Archivos Clave del Módulo

- **Nginx Config**: [config/nginx/nginx.conf](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/config/nginx/nginx.conf)
- **Frontend**: [apps/frontend/index.html](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/apps/frontend/index.html)
- **Docker Compose**: [docker-compose.yml](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/docker-compose.yml)

---

## 🚀 Cómo Reanudar el Trabajo en la Nueva Máquina

### 1. Clonar y Levantar

Asegúrate de tener Docker instalado en el nuevo equipo y ejecuta:

```bash
# Levantar todos los servicios en segundo plano
docker compose up --build -d
```

### 2. Probar Localmente

Abre en tu navegador la dirección `http://localhost`. Podrás:

- Interactuar con el panel de Estaciones Médicas y Terminales Administrativas.
- Probar la comunicación por WebSockets en tiempo real.

---

## ☁️ Instrucciones Rápidas para Desplegar en Google Cloud Platform (GCP)

Para realizar el despliegue usando únicamente **Cloud Shell**:

1. **Configurar variables e infraestructura**:

   ```bash
   PROJECT_ID=$(gcloud config get-value project)
   ZONE="us-central1-a"
   VM_NAME="salud-distribuida-vm"

   # Habilitar API de Compute Engine
   gcloud services enable compute.googleapis.com

   # Crear regla de Firewall para HTTP/S
   gcloud compute firewall-rules create allow-http-https \
       --allow tcp:80,tcp:443 \
       --target-tags=http-server,https-server
   ```

2. **Crear VM y Desplegar**:

   ```bash
   # Crear Instancia
   gcloud compute instances create $VM_NAME \
       --project=$PROJECT_ID \
       --zone=$ZONE \
       --machine-type=e2-medium \
       --image-family=debian-11 \
       --image-project=debian-cloud \
       --tags=http-server,https-server \
       --metadata=startup-script="apt-get update && apt-get install -y docker.io docker-compose git"

   # Conectarse por SSH
   gcloud compute ssh $VM_NAME --zone=$ZONE
   ```

3. **Dentro de la VM**:

   ```bash
   git clone <URL_DE_TU_REPOSITORIO> Proyecto-OSDS
   cd Proyecto-OSDS
   sudo docker-compose up -d
   exit
   ```

4. **Obtener IP Pública**:
   ```bash
   gcloud compute instances describe $VM_NAME \
       --zone=$ZONE \
       --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
   ```
