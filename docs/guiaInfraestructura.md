# Guía de Operación e Infraestructura en GCP Cloud Shell

Este documento recopila todos los comandos y el conocimiento técnico necesario para operar las máquinas virtuales (VMs) en Google Cloud Platform, reconstruir el sistema desde cero y entender el funcionamiento de GCP Cloud Shell.

---

## ⚡ 1. Inicialización Diaria (Post-Apagado de VMs)

Cuando hayas apagado las máquinas virtuales para ahorrar créditos y desees reanudar el trabajo o prepararte para la presentación/defensa del proyecto:

### Paso 1: Configurar el proyecto de GCP
Asegúrate de que Cloud Shell esté apuntando al proyecto correcto del curso:
```bash
gcloud config set project os-ds-498615
```

### Paso 2: Iniciar las 3 VMs
Ejecuta el encendido de todas las máquinas virtuales en la zona central:
```bash
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

### Paso 3: Verificar el estado de las VMs
Comprueba que las máquinas tienen asignada una IP externa y están en estado `RUNNING`:
```bash
gcloud compute instances list
```

---

## 🏗️ 2. Reconstrucción Completa desde Cero (Si se borran las VMs)

Si por error se eliminan las instancias en la consola de GCP y necesitas recrear la red, instalar Docker, clonar el repositorio y levantar todo el ecosistema distribuido:

### Opción A: Ejecutar el Script Automatizado (Recomendado)
El repositorio cuenta con un script que realiza la creación de instancias, asigna IPs privadas fijas (para que no se rompan las conexiones internas), instala dependencias y despliega el código:
```bash
cd ~/Proyecto-OSDS
chmod +x scripts/rebuild-gcp-vms.sh
./scripts/rebuild-gcp-vms.sh
```

### Opción B: Ejecución Manual Paso a Paso
Si necesitas ejecutar los comandos uno a uno de manera controlada:

#### 1. Crear las 3 Máquinas Virtuales con IPs fijas
```bash
ZONE="us-central1-a"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
DISK_SIZE="10GB"

# VM 1 (Hospital Local)
gcloud compute instances create vm-hospital-local \
    --zone=$ZONE --machine-type=e2-micro --private-network-ip=10.128.0.10 \
    --image-family=$IMAGE_FAMILY --image-project=$IMAGE_PROJECT --boot-disk-size=$DISK_SIZE

# VM 2 (Nube Central)
gcloud compute instances create vm-nube-central \
    --zone=$ZONE --machine-type=e2-micro --private-network-ip=10.128.0.20 \
    --image-family=$IMAGE_FAMILY --image-project=$IMAGE_PROJECT --boot-disk-size=$DISK_SIZE

# VM 3 (Gateway / Middleware) - NOTA: Debe ser e2-medium por uso de RAM
gcloud compute instances create vm-gateway \
    --zone=$ZONE --machine-type=e2-medium --private-network-ip=10.128.0.30 \
    --image-family=$IMAGE_FAMILY --image-project=$IMAGE_PROJECT --boot-disk-size=$DISK_SIZE
```

#### 2. Instalar Docker y Docker Compose en cada VM (Vía SSH)
Conéctate a cada VM e instala el motor de contenedores:
```bash
# Ejecutar esto dentro de cada VM tras conectarte con: gcloud compute ssh <nombre-vm> --zone=us-central1-a
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
```

#### 3. Desplegar los Contenedores
Clona el repositorio e inicia Docker Compose en sus respectivas carpetas:
*   **VM1 (`vm-hospital-local`):**
    ```bash
    git clone -b parte3/general https://github.com/maruzs/Proyecto-OSDS.git ~/Proyecto-OSDS
    cd ~/Proyecto-OSDS/vms/vm1-hospital && sudo docker compose up --build -d
    ```
*   **VM2 (`vm-nube-central`):**
    ```bash
    git clone -b parte3/general https://github.com/maruzs/Proyecto-OSDS.git ~/Proyecto-OSDS
    cd ~/Proyecto-OSDS/vms/vm2-nube && sudo docker compose up --build -d
    ```
*   **VM3 (`vm-gateway`):**
    ```bash
    git clone -b parte3/general https://github.com/maruzs/Proyecto-OSDS.git ~/Proyecto-OSDS
    echo "TUNNEL_TOKEN=eyJhIjoiZjFhOTc0NWIzMDA1OTZjMjY2OTE0YzE2NDJlNDIwNDAiLCJ0IjoiN2I5YTQ1YzktMTBlMS00YjQ5LWIxMDctNjNjZTc3OTBiOTNhIiwicyI6Ik1HSTRPRFJtWkRVdE0yWmlZaTAwWkRkbExUZzBOalF0WkROaVpUYzFZMkZpTmpGbCJ9" > ~/Proyecto-OSDS/vms/vm3-gateway/.env
    cd ~/Proyecto-OSDS/vms/vm3-gateway && sudo docker compose up --build -d
    ```

---

## 💡 3. Conocimiento General de GCP Cloud Shell

Google Cloud Shell es una máquina virtual de desarrollo que Google provee de manera gratuita asociada a tu cuenta. A continuación, se detallan aspectos clave que debes conocer:

1.  **Persistencia del Directorio Home (`~/` o `/home/marianoemunozr`):**
    *   Cloud Shell conserva los datos de tu carpeta personal de manera **permanente** (hasta 5 GB de almacenamiento).
    *   Cualquier repositorio clonado en tu directorio Home, llaves SSH o configuraciones locales sobrevivirán aunque apagues la computadora, cierres sesión o Cloud Shell se reinicie por inactividad.
    *   **¡Cuidado!** Los archivos creados fuera del directorio Home (como `/tmp`, `/var` o paquetes instalados a nivel de sistema con `sudo apt-get`) se **borrarán** al reiniciar la sesión.

2.  **Autenticación Automática del SDK de GCP (`gcloud`):**
    *   Cloud Shell se inicia sesión automáticamente con la cuenta de Google con la que accediste a la consola de GCP. No necesitas ingresar contraseñas o tokens para ejecutar comandos `gcloud`.
    *   Si los permisos fallan temporalmente, puedes forzar la re-autenticación ejecutando:
        ```bash
        gcloud auth login
        ```

3.  **Proyectos Activos de GCP:**
    *   Dado que puedes tener acceso a varios proyectos (personales, de cursos, etc.), asegúrate siempre de revisar cuál es tu proyecto activo en la consola actual de Cloud Shell:
        ```bash
        gcloud config get-value project
        ```
    *   Si ves un proyecto diferente a `os-ds-498615`, cámbialo de inmediato:
        ```bash
        gcloud config set project os-ds-498615
        ```

4.  **Túnel IAP (Identity-Aware Proxy):**
    *   Si por políticas de firewall de red no puedes ingresar por SSH normal a tus instancias o la conexión puerto 22 rebota, puedes forzar a que la conexión pase a través del túnel seguro de Google Cloud:
        ```bash
        gcloud compute ssh vm-gateway --zone=us-central1-a --tunnel-through-iap
        ```
