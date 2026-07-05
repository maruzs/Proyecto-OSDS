# Centro de Salud Digital - Proyecto 3 (Sistemas Distribuidos)

Este repositorio ha sido unificado y organizado como un **Monorepo** bajo la rama `parte3/general` para simplificar la gestión del código, el desarrollo local y el despliegue distribuido en Google Cloud Platform (GCP).

---

## 📁 Estructura del Monorepo

*   **`vms/`**: Contiene la configuración y el código correspondiente a cada Máquina Virtual.
    *   **`vm1-hospital/`**: Servidores de aplicación (`app-estaciones`) y base de datos local (`db-local` en MariaDB).
    *   **`vm2-nube/`**: Módulo administrativo (`app-terminales`) y base de datos central (`db-nube` en PostgreSQL).
    *   **`vm3-gateway/`**: Proxy inverso (`nginx-proxy`), Frontend de simulación y el cliente de túnel seguro (`cloudflare-tunnel`).
*   **`diagrama/`**: Recursos y código de los diagramas de arquitectura.
*   **`scripts/`**: Scripts de automatización y recreación de infraestructura.
*   **`informe.tex`**: Documento de reporte del proyecto en formato LaTeX.

---

## 🚀 Guía de Despliegue en GCP (Google Cloud Shell)

Hemos creado un script automatizado para reconstruir todas las VMs e instalar Docker y configurar el código directamente.

### 1. Reconstruir e Inicializar las VMs en GCP
Ejecuta el script de reconstrucción desde tu terminal de **Google Cloud Shell**:
```bash
./scripts/rebuild-gcp-vms.sh
```
*Este script creará las VMs `vm-hospital-local`, `vm-nube-central`, y `vm-gateway`, instalará Docker/Docker Compose en cada una, clonará este repositorio en la rama `parte3/general` y levantará los servicios iniciales.*

### 2. Configurar la Replicación Lógica Bidireccional
Una vez que los contenedores estén corriendo en las VMs, ejecuta los siguientes comandos en Cloud Shell para establecer las suscripciones de replicación:

```bash
# Crear suscripción en VM2 (Nube Central) conectando a la VM1
gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec -it db-nube psql -U postgres -d clinica -c \"CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false);\""

# Crear suscripción en VM1 (Hospital Local) conectando a la VM2
gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec -it db-local psql -U postgres -d clinica -c \"CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=db-nube port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false);\""
```

---

## ⚙️ Control de Infraestructura (Comandos Útiles)

### Iniciar las VMs
```bash
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

### Detener las VMs (Apagado para ahorrar créditos)
```bash
gcloud compute instances stop vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

### Acceso SSH a una VM específica
*   **Hospital Local:** `gcloud compute ssh vm-hospital-local --zone=us-central1-a`
*   **Nube Central:** `gcloud compute ssh vm-nube-central --zone=us-central1-a`
*   **Gateway:** `gcloud compute ssh vm-gateway --zone=us-central1-a`
