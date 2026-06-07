# Sistema Médico Distribuido - Centro de Salud Multientorno

Este repositorio contiene la implementación y documentación del diseño de **infraestructura transversal**, **redes distribuidas**, **seguridad** y el **mecanismo de sincronización de datos** para el Proyecto de la asignatura **Sistemas Operativos y Distribuidos (OSDS)**.

El sistema simula un entorno de salud híbrido distribuido, estableciendo canales de comunicación en tiempo real y aislamiento entre un **Hospital Local** (Entorno Físico) y el **Entorno Nube** (Remoto), comunicados mediante WebSockets y sincronizados bidireccionalmente de manera asíncrona usando replicación lógica en **PostgreSQL 16**.

---

## 🏗️ 1. Arquitectura de Red y Topología Distribuida

Para asegurar una topología verdaderamente distribuida en producción, el sistema se despliega en **3 Máquinas Virtuales (VMs)** dentro de Google Cloud Platform (GCP), conectadas bajo una red VPC personalizada común que garantiza la comunicación a través de IPs privadas internas.

### Distribución de Componentes en GCP

| Componente | Tipo / Servicio | VM de Ejecución | IP Interna | Puerto | Descripción / Acceso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Interfaz Web | **VM 3 (Gateway)** | `10.128.0.30` | `80` / `443` | Interfaz gráfica servida por Nginx. |
| **Nginx Proxy** | Gateway / Seguridad | **VM 3 (Gateway)** | `10.128.0.30` | `80` / `443` | Única entrada pública. Enruta WebSockets a VM 1 y VM 2. |
| **app-estaciones** | Backend Clínico | **VM 1 (Hospital Local)** | `10.128.0.10` | `8001` | Maneja eventos clínicos (`consultar_paciente`, etc.) vía WebSockets. |
| **db-local** | Base de Datos Local | **VM 1 (Hospital Local)** | `10.128.0.10` | `5432` | PostgreSQL local con datos de alta demanda y caché local. |
| **app-terminales** | Backend Admisión | **VM 2 (Nube Central)** | `10.128.0.20` | `8002` | Gestiona el ingreso y admisión de pacientes. |
| **db-nube** | Base de Datos Nube | **VM 2 (Nube Central)** | `10.128.0.20` | `5432` | PostgreSQL central con el historial clínico global consolidado. |

---

## 🗂️ 2. Estructura del Repositorio

El proyecto se estructura de forma modular de la siguiente manera:

```bash
.
├── VM3/                            # Carpeta específica para VM 3 (Gateway)
│   ├── docker-compose.yml          # Orquestador del Gateway (Nginx + Cloudflare Tunnel)
│   └── nginx.conf                  # Enrutamiento de reverse proxy para WebSockets e IPs privadas
├── apps/
│   ├── estaciones-medicas/         # Backend de la Estación Médica (VM 1)
│   ├── terminales-administrativas/ # Backend del Terminal de Admisión (VM 2)
│   └── frontend/                   # Interfaz Web Unificada (Login por roles y vistas)
├── config/
│   ├── db/
│   │   ├── init-local.sql          # Esquema local y publicación (VM 1)
│   │   └── init-nube.sql           # Esquema en nube y publicación (VM 2)
│   └── nginx/
│       └── nginx.conf              # Configuración de respaldo para Nginx
├── scripts/
│   ├── setup-and-test.js           # Script de integración E2E local
│   ├── test-replication.js         # Script de validación de replicación lógica bidireccional
│   └── test-direct.js              # Script de validación de endpoints directos
├── docker-compose.yml              # Orquestador multi-contenedor para simulación local
└── README.md                       # Documentación consolidada del proyecto (Este archivo)
```

---

## ⚙️ 3. Componentes de Infraestructura y Datos

### A. Estrategia de Replicación y Evitación de Bucles Infinitos
Para habilitar una replicación bidireccional activa-activa sin caer en bucles circulares infinitos (donde un dato replicado se re-publique de vuelta al nodo origen), se implementan dos mecanismos de **PostgreSQL 16**:

1. **Filtros de Fila en Publicaciones:**
   - La base local define su publicación para enviar únicamente datos creados en el entorno físico local:
     ```sql
     CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes WHERE (origen_registro = 'local');
     ```
   - La base en la nube define su publicación para enviar únicamente datos creados en la administración central:
     ```sql
     CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes WHERE (origen_registro = 'nube');
     ```

2. **Cláusula de Origen en la Suscripción (`origin = none`):**
   - Al crear las suscripciones cruzadas, se configura `origin = none`. Esto le indica a PostgreSQL que solo debe importar cambios que se hayan originado localmente en el nodo publicador y omitir los cambios que ese nodo importó de otros servidores.
   - Requiere obligatoriamente **PostgreSQL 16+** (configurado en la imagen `postgres:16-alpine` en este proyecto).

---

## 🛡️ 4. Gestión de Seguridad, Autenticación y Autorización (SecOps)

Al ser un sistema distribuido que maneja datos médicos altamente sensibles (fichas clínicas), el control de acceso y los permisos se gestionan en tres niveles:

### A. Tres Niveles de Seguridad de Acceso
1. **Autenticación en el Cliente (Frontend) y Gateway (VM 3):**
   - El **Frontend** provee un inicio de sesión básico para identificar el trabajador y su rol.
   - **Nginx (VM 3)** actúa como barrera perimetral enrutando las peticiones a través de la red privada VPC de GCP, evitando exponer directamente los backends clínicos a internet.
2. **Autorización basada en Roles (RBAC) en Backends:**
   - La lógica de negocio valida los roles que realizan peticiones mediante WebSockets.
   - **Backend de Estaciones (`app-estaciones` en VM 1):** Valida en cada evento (`consultar_paciente`, `actualizar_diagnostico`) que el usuario solicitante sea un **`Médico`** o **`Enfermero`**.
   - **Backend de Terminales (`app-terminales` en VM 2):** Valida en el evento de admisión (`admitir_paciente`) que el usuario tenga el rol de **`Administrativo`**.
3. **Control de Acceso en Bases de Datos (VM 1 y VM 2):**
   - Las conexiones entre las aplicaciones y sus bases de datos utilizan cuentas con privilegios mínimos necesarios (como `app_user` restringido a consultas `SELECT`, `INSERT` y `UPDATE` en la tabla `fichas_pacientes`, previniendo acciones destructivas como `DROP` o `DELETE`).

### B. HTTPS Seguro con Cloudflare Tunnel (VM 3)
Para encriptar las comunicaciones de extremo a extremo sin exponer puertos públicos al exterior, se implementa Cloudflare Tunnel en la **VM 3 (Gateway)**:
- **Cero Puertos Abiertos:** Permite cerrar los puertos entrantes `80` y `443` en el Firewall de GCP, ya que el contenedor de Cloudflare (`cloudflared`) inicia una conexión de salida segura y persistente hacia los servidores de Cloudflare.
- **SSL y Cifrado Automatizados:** Cloudflare gestiona los certificados HTTPS legítimos, resolviendo las conexiones mediante el subdominio configurado (ej. `osdsp3.epistia.cl`).
- **Mitigación DDoS:** Cloudflare actúa como escudo perimetral y proxy para proteger el portal clínico de ataques dirigidos.

---

## 🛠️ 5. Guía de Aprovisionamiento y Despliegue en GCP (gcloud)

### 1. Variables de Entorno Iniciales (Ejecutar en Cloud Shell)
```bash
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
ZONE="us-central1-a"
NETWORK_NAME="salud-vpc"
SUBNET_NAME="salud-subnet"
SUBNET_RANGE="10.128.0.0/24"
```

### 2. Habilitar la API de Compute Engine
```bash
gcloud services enable compute.googleapis.com --project=$PROJECT_ID
```

### 3. Configuración de Red VPC y Subredes
```bash
# Crear la Red VPC personalizada
gcloud compute networks create $NETWORK_NAME --project=$PROJECT_ID --subnet-mode=custom

# Crear la subred
gcloud compute networks subnets create $SUBNET_NAME \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --region=$REGION \
    --range=$SUBNET_RANGE
```

### 4. Reglas de Firewall
```bash
# 1. Permitir comunicación interna completa en la VPC (para bases de datos y apps)
gcloud compute firewall-rules create allow-internal-salud \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --allow tcp,udp,icmp \
    --source-ranges=$SUBNET_RANGE \
    --description="Tránsito interno de datos"

# 2. Permitir conexión SSH mediante túnel IAP
gcloud compute firewall-rules create allow-ssh-ingress-from-iap \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --direction=INGRESS \
    --action=allow \
    --rules=tcp:22 \
    --source-ranges=35.235.240.0/20 \
    --description="Acceso SSH seguro desde IAP"

# 3. Permitir tráfico HTTP/HTTPS externo (para la VM 3 / Gateway)
gcloud compute firewall-rules create allow-http-https \
    --project=$PROJECT_ID \
    --network=$NETWORK_NAME \
    --allow tcp:80,tcp:443 \
    --target-tags=http-server,https-server \
    --description="Tráfico web público"
```

### 5. Creación de las 3 VMs
```bash
# VM 1: Hospital Local (IP: 10.128.0.10)
gcloud compute instances create vm-hospital-local \
    --project=$PROJECT_ID --zone=$ZONE --machine-type=e2-medium \
    --network=$NETWORK_NAME --subnet=$SUBNET_NAME --private-network-ip=10.128.0.10 \
    --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose"

# VM 2: Nube Central (IP: 10.128.0.20)
gcloud compute instances create vm-nube-central \
    --project=$PROJECT_ID --zone=$ZONE --machine-type=e2-medium \
    --network=$NETWORK_NAME --subnet=$SUBNET_NAME --private-network-ip=10.128.0.20 \
    --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose"

# VM 3: Gateway (IP: 10.128.0.30)
gcloud compute instances create vm-gateway \
    --project=$PROJECT_ID --zone=$ZONE --machine-type=e2-medium \
    --network=$NETWORK_NAME --subnet=$SUBNET_NAME --private-network-ip=10.128.0.30 \
    --tags=http-server,https-server \
    --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
    --metadata=startup-script="apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose"
```

### 6. Comandos de Control de Energía (Encendido / Apagado de VMs)
Para no generar costos innecesarios, puedes controlar el encendido de los servidores desde Cloud Shell:
```bash
# Encender todas las instancias
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a

# Apagar todas las instancias
gcloud compute instances stop vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

---

## 🔄 6. Paso a Paso: Activación de la Replicación Bidireccional en GCP

Una vez levantados los servicios de base de datos en sus respectivas VMs, ejecuta las siguientes suscripciones lógicas de forma independiente para evitar bloques de transacciones.

### 1. En la VM 2 (Nube Central)
Accede mediante SSH:
```bash
gcloud compute ssh vm-nube-central --zone=us-central1-a --tunnel-through-iap
```
Entra al proyecto y levanta sus servicios:
```bash
cd Proyecto-OSDS
sudo docker-compose up -d db-nube app-terminales
```
Ejecuta la suscripción hacia la VM 1:
```bash
# DROP previo si aplica
sudo docker exec -i db-nube psql -U postgres -d clinica -c "DROP SUBSCRIPTION IF EXISTS sub_desde_local;"

# CREATE de la suscripción con origin = none
sudo docker exec -i db-nube psql -U postgres -d clinica -c "CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=10.128.0.10 port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false, origin = none);"
```
Sal de la VM 2:
```bash
exit
```

### 2. En la VM 1 (Hospital Local)
Accede mediante SSH:
```bash
gcloud compute ssh vm-hospital-local --zone=us-central1-a --tunnel-through-iap
```
Entra al proyecto y levanta sus servicios:
```bash
cd Proyecto-OSDS
sudo docker-compose up -d db-local app-estaciones
```
Ejecuta la suscripción de retorno hacia la VM 2:
```bash
# DROP previo si aplica
sudo docker exec -i db-local psql -U postgres -d clinica -c "DROP SUBSCRIPTION IF EXISTS sub_desde_nube;"

# CREATE de la suscripción de retorno con origin = none
sudo docker exec -i db-local psql -U postgres -d clinica -c "CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=10.128.0.20 port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false, origin = none);"
```
Verifica que ambas suscripciones estén habilitadas (`subenabled = t`):
```bash
sudo docker exec -i db-local psql -U postgres -d clinica -c "SELECT subname, subenabled, subpublications FROM pg_subscription;"
```
Sal de la VM 1:
```bash
exit
```

---

## 🌐 7. Despliegue de VM 3 (Gateway / Nginx / Cloudflare Tunnel)

Accede a la VM 3 por SSH:
```bash
gcloud compute ssh vm-gateway --zone=us-central1-a --tunnel-through-iap
```

Despliega el proxy inverso Nginx y el túnel seguro de Cloudflare:
```bash
cd Proyecto-OSDS/VM3

# (Opcional) Si posees un token de túnel seguro para el dominio:
echo "TUNNEL_TOKEN=TU_TOKEN_CLOUDFLARE_AQUI" > .env

# Iniciar servicios del Gateway
sudo docker-compose up -d
```

### Acceso a la Aplicación
El proxy inverso expone el Frontend en el puerto `80` de la IP externa de la VM 3 y enruta los WebSockets (`/ws-medicas` y `/ws-administrativas`) hacia las IPs internas privadas. Puedes acceder utilizando:
- La IP pública directa de tu VM 3: `http://<IP_PUBLICA_VM3>`
- A través del túnel seguro HTTPS si fue configurado: `https://osdsp3.epistia.cl`

---

## 🧪 8. Pruebas de Integración E2E (Simulación Local)

El proyecto cuenta con un entorno de integración automatizada en local para verificar la consistencia del enrutamiento de red y la sincronización de bases de datos antes de subir a GCP.

Para ejecutar los tests de integración en tu máquina local:
```bash
# Instalar dependencias necesarias
pnpm install

# Levantar contenedores y comprobar la replicación bidireccional y proxy Nginx
node scripts/setup-and-test.js
```

---

## 👥 9. Distribución y Plan de Trabajo del Grupo

* **Integrante 1:** Área Estaciones Médicas (`app-estaciones` y `db-local` en **VM 1**). Lógica de eventos WebSocket clínicos y control de acceso.
* **Integrante 2:** Área Terminales Administrativas (`app-terminales` y `db-nube` en **VM 2**). Lógica de admisión de pacientes y registro en nube.
* **Integrante 3 (DevOps e Infraestructura):** Redes VPC, subredes, firewalls en GCP, aprovisionamiento de VMs, Docker/Compose, replicación lógica PostgreSQL 16 con `origin = none` y filtros de fila.
* **Integrante 4:** Seguridad, Gateway y QA (`nginx-proxy` y Frontend en **VM 3**). Balanceador, enrutamiento privado de sockets, encriptación SSL por túnel y rate limiting.
