# Nodo Hospital Local (VM 1) - Proyecto OSDS

Este nodo de la infraestructura distribuida corresponde al **Hospital Local (VM 1)** de la simulación de centro de salud.

## ⚙️ Componentes Locales (VM 1)
*   **`db-local`**: Base de datos PostgreSQL 16 con los datos de alta demanda y caché local, además de publicación activa para replicación lógica.
*   **`app-estaciones`**: Servidor de backend en Node.js que gestiona consultas y actualizaciones de fichas clínicas mediante WebSockets.

---

## 🚀 Guía de Despliegue Global en GCP con GCloud

Ejecuta esta secuencia completa de comandos directamente desde la terminal de **Google Cloud Shell** para iniciar las VMs y desplegar todo el entorno distribuido:

### 1. Encender las Máquinas Virtuales en GCP
```bash
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

### 2. Desplegar VM 1 (Hospital Local)
```bash
gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="cd ~/Proyecto-OSDS && git fetch origin && git checkout VM1 && git pull origin VM1 && sudo docker rm -f nginx-proxy cloudflare-tunnel app-terminales app-estaciones db-local db-nube 2>/dev/null; sudo docker-compose up --build -d --remove-orphans && sleep 5 && sudo docker exec -it db-local psql -U postgres -d clinica -c 'ALTER TABLE fichas_pacientes REPLICA IDENTITY FULL;'"
```

### 3. Desplegar VM 2 (Nube Central)
```bash
gcloud compute ssh vm-nube-central --zone=us-central1-a --command="cd ~/Proyecto-OSDS && git fetch origin && git checkout VM2 && git pull origin VM2 && sudo docker rm -f nginx-proxy cloudflare-tunnel app-terminales app-estaciones db-local db-nube 2>/dev/null; sudo docker-compose up --build -d --remove-orphans && sleep 5 && sudo docker exec -it db-nube psql -U postgres -d clinica -c 'ALTER TABLE fichas_pacientes REPLICA IDENTITY FULL;'"
```

### 4. Desplegar VM 3 (Gateway - Reemplazar TU_TUNNEL_TOKEN con tu token de Cloudflare)
```bash
gcloud compute ssh vm-gateway --zone=us-central1-a --command="cd ~/Proyecto-OSDS && git fetch origin && git checkout VM3 && git pull origin VM3 && echo 'TUNNEL_TOKEN=TU_TUNNEL_TOKEN' > .env && sudo docker rm -f nginx-proxy cloudflare-tunnel app-terminales app-estaciones db-local db-nube 2>/dev/null; sudo docker-compose up -d --remove-orphans"
```

### 5. Configurar Replicación Lógica Bidireccional (Una vez levantados los servicios)
```bash
# Crear suscripción en VM2 (Nube Central) conectando a la VM1
gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec -it db-nube psql -U postgres -d clinica -c \"CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false);\""

# Crear suscripción en VM1 (Hospital Local) conectando a la VM2
gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec -it db-local psql -U postgres -d clinica -c \"CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=db-nube port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false);\""
```

### 6. Apagar las Máquinas Virtuales (Cuando termines las pruebas)
```bash
gcloud compute instances stop vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```
