# Centro de Salud Digital - Proyecto 3 (Sistemas Distribuidos)

Este repositorio contiene la solución completa de arquitectura distribuida para la Unidad 3, organizada como un **Monorepo** unificado en la rama `parte3/general` para simplificar la gestión del código, el desarrollo y el despliegue en Google Cloud Platform (GCP).

---

## 📁 Estructura del Monorepo

*   **`vms/`**: Contiene el código fuente y orquestación de cada una de las 3 VMs.
    *   **`vm1-hospital/`**: Servidor de Box de Consulta (`app-estaciones` y `app-estaciones-replica` en Node.js) y base MariaDB (Maestro-Réplica + HAProxy).
    *   **`vm2-nube/`**: Módulo administrativo de admisión (`app-terminales` y `app-terminales-replica` en **Python**) y base PostgreSQL 16 (Maestro-Réplica + HAProxy).
    *   **`vm3-gateway/`**: Proxy inverso (`nginx-proxy`), Túnel Cloudflare, **Middleware** de integración (Node.js + SQLite de contingencia) y **Aplicación 3** de Bodega/Inventario (Node.js) con base de datos centralizada MySQL 8.0 (Maestro-Réplica + HAProxy).
*   **`diagrama/`**: Contiene el diagrama de arquitectura actualizado (`arqui.puml`).
*   **`scripts/`**: Automatización de la infraestructura en GCP Cloud Shell.
*   **`pruebasTolerancia.md`**: Guía paso a paso para simulaciones de caídas.
*   **`documentacion.md`**: Explicación técnica detallada de la arquitectura.
*   **`informe.tex`**: Informe formal en LaTeX.

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
Consulte el archivo **[pruebasTolerancia.md](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/pruebasTolerancia.md)** para obtener instrucciones detalladas sobre cómo desconectar aplicaciones, bases de datos o el Middleware y validar la resiliencia del sistema.

## 📖 Documentación Detallada
Consulte el archivo **[documentacion.md](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/documentacion.md)** para una explicación completa de las tecnologías, proxies HAProxy y lógica del worker de contingencia en segundo plano.
