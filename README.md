# Proyecto OSDS - Sistema Clínico Distribuido, Tolerante a Fallos y Altamente Disponible (GCP)

Este repositorio contiene la implementación de un **sistema clínico distribuido de gestión de fichas clínicas y estaciones médicas**. Diseñado bajo principios de sistemas distribuidos avanzados, simula y coordina las operaciones en tiempo real entre un **Hospital Local** (baja latencia, operaciones clínicas directas) y una **Nube Central** (histórico de admisiones, sistema de stock de bodega y contingencia offline), desplegado en **Google Cloud Platform (GCP)**.

El sistema garantiza **Alta Disponibilidad (HA)** y **Tolerancia a Fallos** en todas sus capas, utilizando una topología de red en estrella con enrutamiento seguro mediante Cloudflare Tunnel y balanceadores de carga integrales.

---

## 🏗️ Arquitectura del Sistema y Topología de Red

El ecosistema se distribuye físicamente en **3 Máquinas Virtuales (VMs)** conectadas mediante una red privada VPC en GCP en la zona `us-central1-a`:

```
                  [ Navegador del Usuario (Cliente) ]
                                   │
                        ( HTTPS / WSS Seguro )
                                   ▼
                     [ VM 3: Cloudflare Tunnel ]
                                   │ (Túnel Inverso)
                                   ▼
                     [ VM 3: Nginx Proxy Inverso ]
             ┌─────────────────────┴─────────────────────┐
   (ws-medicas / ws-adm)                      (ws-administrativas)
             ▼                                           ▼
 ┌──────────────────────────┐                ┌──────────────────────────┐
 │ VM 1: Hospital Local     │                │ VM 2: Nube Central       │
 │ IP: 10.128.0.10          │                │ IP: 10.128.0.20          │
 ├──────────────────────────┤                ├──────────────────────────┤
 │ ├─ App Estaciones (Main) │                │ ├─ App Terminales (Main) │
 │ ├─ App Estaciones (Repl) │                │ ├─ App Terminales (Repl) │
 │ ├─ HAProxy PostgreSQL    │                │ ├─ HAProxy PostgreSQL    │
 │ ├─ PostgreSQL Master     │                │ ├─ PostgreSQL Master     │
 │ └─ PostgreSQL Replica    │                │ └─ PostgreSQL Replica    │
 └────────────┬─────────────┘                └────────────┬─────────────┘
              │ (HTTP POST)                               │ (HTTP POST)
              └─────────────────────┬─────────────────────┘
                                    ▼
                       ┌──────────────────────────┐
                       │ VM 3: Gateway / Central  │
                       ├──────────────────────────┤
                       │ ├─ Middleware API (MW)   │
                       │ │   └─ PostgreSQL cont.  │
                       │ ├─ App 3: Bodega / Stock │
                       │ ├─ HAProxy PostgreSQL    │
                       │ ├─ PostgreSQL Central M. │
                       │ └─ PostgreSQL Central R. │
                       └──────────────────────────┘
```

---

## 💻 Heterogeneidad de Componentes

Para simular la integración de sistemas heredados (legacy) y cumplir con la heterogeneidad tecnológica, cada nodo opera bajo diferentes infraestructuras:

### A. VM 1 — Hospital Local (Estaciones Médicas)
*   **Base de Datos Local**: **PostgreSQL 16** configurado con esquema Maestro-Réplica físico mediante streaming replication (`pg_basebackup`).
*   **Balanceador/Proxy de DB**: **HAProxy** escuchando en el puerto `5432` redirigiendo de forma transparente las consultas al nodo maestro saludable.
*   **Backend clínico**: Servidor en **Node.js (JavaScript)** que interactúa con la base de datos a través de HAProxy y mantiene conexiones en tiempo real vía WebSockets (`socket.io`).
*   **Frontend**: Interfaz gráfica del médico para gestionar fichas y diagnósticos en tiempo real.

### B. VM 2 — Nube Central (Terminales Administrativas)
*   **Base de Datos Centralizada**: **PostgreSQL 16** con replicación física Maestro-Réplica.
*   **Backend administrativo**: Servidor asíncrono de alto rendimiento en **Python 3.10** (`python-socketio`, `aiohttp`, `asyncpg`) encargado de gestionar admisiones globales y auditoría.
*   **Frontend**: Interfaz del administrador para registrar pacientes y realizar admisiones.

### C. VM 3 — Gateway & Seguridad
*   **Nginx Proxy Inverso**: Enruta el tráfico externo cifrado hacia las aplicaciones internas del hospital y la nube.
*   **Cloudflare Tunnel**: Expone las interfaces seguras de manera externa (HTTPS) sin abrir puertos públicos a Internet en GCP.
*   **Middleware de Sincronización**: Aplicación en **Node.js/Express** encargada de coordinar las escrituras globales, analizar recetas en diagnósticos clínicos para aplicar descuentos automáticos e interactuar con Bodega.
*   **App 3 (Sistema de Bodega)**: Gestiona el inventario clínico, interactuando con la base de datos central.
*   **Base de Contingencia**: Instancia **PostgreSQL** (`db-contingencia`) dedicada exclusivamente a encolar transacciones en caso de caídas de la base central.

---

## 🛡️ Mecanismos de Tolerancia a Fallos y Resiliencia

El diseño garantiza operaciones continuas mediante redundancias en tres niveles críticos:

1.  **Failover de Aplicaciones (Nginx Upstream)**:
    Si la instancia principal de una aplicación clínica (`app-estaciones` o `app-terminales`) experimenta una interrupción, Nginx detecta el fallo tras un reintento y conmuta el tráfico hacia el contenedor réplica (`app-estaciones-replica` / `app-terminales-replica`) en menos de 5 segundos de forma transparente.
2.  **Resiliencia de Base de Datos (HAProxy Local)**:
    Las aplicaciones se conectan únicamente al puerto del proxy HAProxy (`5432`). Ante una desconexión o falla del servidor PostgreSQL Maestro, HAProxy redirige las conexiones a la Base de Datos Réplica.
3.  **Buffer de Contingencia (Offline Sync Queue)**:
    Si la base de datos central o el microservicio de Bodega se desconectan, el **Middleware** captura el fallo, almacena la transacción en la base PostgreSQL local (`db-contingencia`) con estado `PENDING`, y activa un daemon de sincronización en segundo plano (worker) que reintenta consolidar las transacciones cada 10 segundos una vez que se restablece la comunicación.

---

## 🗂️ Estructura del Monorepo

El repositorio utiliza una estructura unificada y modular administrada con `pnpm`:

```
Proyecto-OSDS/
├── apps/                           # Aplicaciones y servicios del sistema
│   ├── estaciones-medicas/         # App 1: Backend de Estaciones Médicas (Node.js)
│   ├── terminales-administrativas/ # App 2: Backend de Terminales Administrativas (Python)
│   ├── app-bodega/                 # App 3: Sistema de Bodega (Node.js)
│   ├── middleware/                 # Middleware y cola de contingencia (Node.js/Express)
│   └── frontend/                   # Frontend Web Común (HTML/JS)
├── docs/                           # Documentación técnica, diagramas y reportes
│   ├── diagrams/                   # Diagramas de arquitectura UML
│   ├── report/                     # Reporte académico (LaTeX)
│   ├── documentacion.md            # Especificaciones técnicas detalladas
│   ├── pruebasTolerancia.md        # Guía interactiva de simulación de fallos
│   └── guiaInfraestructura.md      # Comandos y guías para operar VMs en GCP
├── scripts/
│   └── rebuild-gcp-vms.sh          # Script de reconstrucción total de VMs y redes en GCP
├── vms/                            # Orquestación de infraestructura mediante Docker Compose
│   ├── vm1-hospital/               # Docker Compose, HAProxy y base local (VM 1)
│   ├── vm2-nube/                   # Docker Compose, HAProxy y base de la nube (VM 2)
│   └── vm3-gateway/                # Docker Compose, Nginx, Middleware, Bodega y DB Central (VM 3)
├── package.json                    # Scripts globales de desarrollo y automatización
└── pnpm-workspace.yaml             # Definición de workspace del monorepo
```

---

## 🚀 Guía Rápida de Despliegue en GCP

### 1. Preparación de las Instancias en GCP
Para iniciar las instancias existentes asociadas al proyecto de GCP:
```bash
gcloud config set project os-ds-498615
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

### 2. Despliegue de Servicios por VM
Conéctate por SSH a cada máquina virtual y clona/levanta el servicio correspondiente:

*   **VM 1 (Hospital Local):**
    ```bash
    git clone https://github.com/maruzs/Proyecto-OSDS.git ~/Proyecto-OSDS
    cd ~/Proyecto-OSDS/vms/vm1-hospital
    sudo docker compose up --build -d
    ```
*   **VM 2 (Nube Central):**
    ```bash
    git clone https://github.com/maruzs/Proyecto-OSDS.git ~/Proyecto-OSDS
    cd ~/Proyecto-OSDS/vms/vm2-nube
    sudo docker compose up --build -d
    ```
*   **VM 3 (Gateway / Middleware / Central):**
    ```bash
    git clone https://github.com/maruzs/Proyecto-OSDS.git ~/Proyecto-OSDS
    # Crea el archivo .env con el TUNNEL_TOKEN provisto
    echo "TUNNEL_TOKEN=tu_cloudflare_token_aqui" > ~/Proyecto-OSDS/vms/vm3-gateway/.env
    cd ~/Proyecto-OSDS/vms/vm3-gateway
    sudo docker compose up --build -d
    ```

---

## 🧪 Pruebas de Tolerancia a Fallos

Para realizar la verificación empírica de la tolerancia a fallos (caída de aplicaciones, caída del PostgreSQL maestro, y caída del sistema de bodega con recuperación asíncrona), por favor sigue la [Guía Detallada de Pruebas de Tolerancia a Fallos](file:///c:/Users/Administrator/Desktop/Proyecto-OSDS/docs/pruebasTolerancia.md).
