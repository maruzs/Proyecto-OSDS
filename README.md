# Centro de Salud Digital - Proyecto 3 (Sistemas Distribuidos)

Este repositorio contiene la solución completa de arquitectura distribuida para la Unidad 3, organizada como un **Monorepo** unificado en la rama `parte3/general` para simplificar la gestión del código, el desarrollo y el despliegue en Google Cloud Platform (GCP).

---

## 📁 Estructura del Monorepo

*   **`apps/`**: Contiene el código fuente y frontend de cada servicio (estaciones médicas, admisión, bodega, middleware, frontend).
*   **`vms/`**: Contiene las configuraciones de red, HAProxy, Nginx y orquestación de Docker Compose para simular cada una de las 3 VMs.
*   **`docs/`**: Centraliza la documentación del proyecto, diagramas UML (`docs/diagrams/`) e informes formalizados (`docs/report/`).
*   **`scripts/`**: Automatización de la infraestructura en GCP Cloud Shell.

---

## 🚀 Guía de Operación Rápida

### 1. Iniciar las Máquinas Virtuales en GCP
Ejecuta esto en **GCP Cloud Shell** para arrancar las instancias:
```bash
gcloud config set project os-ds-498615
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

### 2. Desplegar los Cambios y Actualizar Servicios
Para descargar los últimos cambios de código y levantar los servicios en segundo plano:

```bash
ZONE="us-central1-a"
BRANCH="parte3/general"

# VM1 (Hospital Local)
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="
  cd ~/Proyecto-OSDS && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH
  cd vms/vm1-hospital && sudo docker compose down --remove-orphans && sudo docker compose up -d
"

# VM2 (Nube Central)
gcloud compute ssh vm-nube-central --zone=$ZONE --command="
  cd ~/Proyecto-OSDS && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH
  cd vms/vm2-nube && sudo docker compose down --remove-orphans && sudo docker compose up -d
"

# VM3 (Gateway / Middleware / Central DB)
gcloud compute ssh vm-gateway --zone=$ZONE --command="
  cd ~/Proyecto-OSDS && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH
  cd vms/vm3-gateway && sudo docker compose down --remove-orphans && sudo docker compose up -d
"
```

---

## 🧪 Pruebas de Tolerancia a Fallos
Consulte el archivo **[pruebasTolerancia.md](file:///c:/Users/Administrator/Desktop/Proyecto-OSDS/docs/pruebasTolerancia.md)** para obtener instrucciones detalladas sobre cómo desconectar aplicaciones, bases de datos o el Middleware y validar la resiliencia del sistema.

## 📖 Documentación Detallada
Consulte el archivo **[documentacion.md](file:///c:/Users/Administrator/Desktop/Proyecto-OSDS/docs/documentacion.md)** para una explicación completa de las tecnologías, proxies HAProxy y lógica del worker de contingencia en segundo plano.
