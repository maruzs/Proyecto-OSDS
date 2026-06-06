# Walkthrough - Implementación de Seguridad y Frontend (Integrante 4)

Se han completado todos los desarrollos correspondientes al **Integrante 4 (SecOps / QA)**. A continuación se detalla el trabajo realizado y cómo verificarlo/desplegarlo.

---

## 🛠️ Cambios Realizados

1. **Proxy Inverso (Nginx)**:
   - Configurado [nginx.conf](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/config/nginx/nginx.conf) para actuar como Gateway Perimetral.
   - Enruta el tráfico WebSocket hacia `/ws-medicas` y `/ws-administrativas` a sus respectivos contenedores de backend.
   - Sirve la interfaz de simulación HTML estática directamente en el puerto `80`.
   
2. **Orquestación**:
   - Integrado el servicio `nginx-proxy` en [docker-compose.yml](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/docker-compose.yml).
   - El proxy está conectado a las redes `hospital_net`, `cloud_net` y `dmz_net` para permitir resolver internamente los contenedores de backend (`app-estaciones` y `app-terminales`).
   
3. **Frontend Interactivo**:
   - Desarrollada la interfaz moderna de control en [index.html](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/apps/frontend/index.html).
   - Incluye indicadores de estado para monitorear en tiempo real la conexión WebSocket de ambos servidores.
   - Proporciona formularios interactivos para:
     - **Estaciones Médicas**: Buscar fichas de paciente por RUT (DB Local) y actualizar su diagnóstico con cambios propagados instantáneamente.
     - **Terminales Administrativas**: Admitir nuevos pacientes desde la nube y visualizar en tiempo real (mediante feed en vivo) cada admisión confirmada.

---

## 🔍 Verificación Local

1. El entorno ya se encuentra levantado y en ejecución. Puedes verificar el estado con:
   ```bash
   docker compose ps
   ```
2. Abre tu navegador en [http://localhost](http://localhost) para interactuar con la interfaz del Centro de Salud.
3. Prueba a registrar un paciente en el panel derecho (Admisiones en la Nube) y observa cómo aparece al instante en el feed de actualizaciones.
4. Luego, búscalo por su RUT en el panel izquierdo (Estaciones Médicas Local) y actualiza su diagnóstico; verás notificaciones en tiempo real confirmando los cambios.

---

## 🚀 Guía Completa de Despliegue en Google Cloud Platform (GCP)

Esta guía paso a paso te permite desplegar todo el entorno utilizando exclusivamente la terminal **Cloud Shell** (sin tocar la interfaz web de la consola de Google Cloud).

### Paso 1: Inicialización
Abre **Cloud Shell** y define las variables de tu entorno:
```bash
PROJECT_ID=$(gcloud config get-value project)
ZONE="us-central1-a"
VM_NAME="salud-distribuida-vm"
```

### Paso 2: Habilitar APIs e Infraestructura de Firewall
Habilita la API de Compute Engine si no lo has hecho:
```bash
gcloud services enable compute.googleapis.com
```

Crea una regla de firewall para permitir tráfico entrante a Nginx (Puertos 80 y 443):
```bash
gcloud compute firewall-rules create allow-http-https \
    --allow tcp:80,tcp:443 \
    --target-tags=http-server,https-server \
    --description="Permitir trafico HTTP/S"
```

### Paso 3: Crear VM en Compute Engine
Crea la máquina virtual en Compute Engine con Docker e instaladores iniciales:
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

### Paso 4: Despliegue de Código vía SSH
Conéctate por SSH a la VM creada:
```bash
gcloud compute ssh $VM_NAME --zone=$ZONE
```
*Una vez dentro de la máquina virtual (espera unos segundos para que termine de correr el script de inicio):*
```bash
# Clonar el repositorio
git clone <URL_DE_TU_REPOSITORIO> Proyecto-OSDS
cd Proyecto-OSDS

# Iniciar todos los contenedores en segundo plano
sudo docker-compose up -d
```
Escribe `exit` para salir de la máquina virtual.

### Paso 5: Obtener Dirección IP de Acceso
Consulta la IP pública externa asignada a tu VM:
```bash
gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
```
Copia la IP devuelta y accede desde tu navegador web para visualizar el panel interactivo.
