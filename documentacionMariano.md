# Documentación de Trabajo - Mariano (Integrante 4: Seguridad, Gateway y QA)

Este documento registra los comandos, modificaciones y configuraciones ejecutadas para desplegar y asegurar la terminal web de salud en la máquina virtual `vm-gateway`.

---

## 1. Información y Diagnóstico de `vm-gateway`

Se utilizaron los siguientes comandos en GCP Cloud Shell para inspeccionar y validar el estado de `vm-gateway` en el proyecto `os-ds-498615`:

```bash
# Listar todas las instancias para verificar IPs y estados
gcloud compute instances list

# Detalle técnico de la VM
gcloud compute instances describe vm-gateway --zone=us-central1-a

# Obtener IPs
# IP Pública: 104.154.143.133
# IP Privada: 10.128.0.30

# Conexión SSH
gcloud compute ssh vm-gateway --zone=us-central1-a
```

---

## 2. Aprovisionamiento de la VM (`vm-gateway`)

Una vez dentro de la VM por SSH, se preparó el entorno con Docker y Docker Compose V2:

```bash
# Actualizar repositorios e instalar dependencias básicas
sudo apt-get update
sudo apt-get install -y docker.io git curl

# Descargar e instalar Docker Compose V2 de manera manual
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose

# Clonar y acceder al repositorio del proyecto
git clone https://github.com/maruzs/Proyecto-OSDS.git
cd Proyecto-OSDS
git checkout mariano
```

---

## 3. Cambios en el Frontend y Nginx

### A. Frontend (`apps/frontend/index.html`)

- **Rediseño Estético:** Se reemplazó la interfaz original por una paleta sobria y limpia orientada a entornos hospitalarios (usando azul clínico `--primary-glow: #0284c7` y verde hospitalario `--secondary-glow: #0d9488`).
- **Vistas basadas en Roles:** Se implementó una vista de login básico. Dependiendo del rol seleccionado:
  - **Médico / Enfermero:** Solo visualizan el panel de _Estaciones Médicas_ (consulta y edición de fichas clínicas).
  - **Administrativo:** Solo visualiza el panel de _Terminales Administrativas_ (admisión de pacientes).
- **Seguridad en WebSockets:** Se modificó la carga útil de los eventos WebSocket (`consultar_paciente`, `actualizar_diagnostico`, `admitir_paciente`) para transmitir el rol y el usuario del profesional que realiza la acción.

### B. Nginx (`config/nginx/nginx.conf`)

- Se cambiaron los upstreams de `proxy_pass` en los bloques `/ws-medicas` y `/ws-administrativas` para redirigir el tráfico a través de la red privada VPC de GCP utilizando las IPs internas correspondientes:
  - **Estaciones Médicas (VM 1):** `http://10.128.0.10:8001`
  - **Terminales Administrativas (VM 2):** `http://10.128.0.20:8002`

---

## 4. Despliegue del Gateway

Para levantar únicamente el Nginx y servir la página web en `vm-gateway` (sin cargar las bases de datos ni backends que corren en las otras VMs), se debe ejecutar dentro del directorio VM3 en la VM:

```bash
# Acceder a la carpeta del componente VM3
cd VM3

# Iniciar el servicio nginx-proxy
sudo docker-compose up --build -d
```

Esto expone la aplicación web en el puerto `80` de la IP pública `104.154.143.133`.
