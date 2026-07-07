# Documentación Técnica del Sistema Distribuido - Proyecto 3 OSDS

Este documento detalla la arquitectura, el diseño de red, la tolerancia a fallos, y los flujos de comunicación del sistema clínico distribuido y tolerante a fallos implementado sobre Google Cloud Platform (GCP).

---

## 🏗️ 1. Arquitectura General y Topología de Red

El sistema se compone de **3 Máquinas Virtuales (VMs)** desplegadas en la zona `us-central1-a` dentro de una red privada VPC en GCP.

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

## 💻 2. Heterogeneidad de Base de Datos y Lenguajes

Para cumplir con las directivas de heterogeneidad e integración de sistemas heredados, cada nodo ejecuta una tecnología y lenguaje diferente:

### A. VM 1: Hospital Local (Estaciones Médicas)
*   **Base de Datos:** **PostgreSQL 16** configurada en esquema Maestro-Réplica. La replicación se realiza a nivel físico mediante streaming con `pg_basebackup`.
*   **Proxy Local:** **HAProxy** escuchando en el puerto `5432` que redirige consultas de lectura/escritura al Maestro y conmuta a la Réplica en caso de caída.
*   **Lenguaje/Backend:** **Node.js (JavaScript)** que utiliza el framework de WebSockets `socket.io` y el driver asíncrono `pg` para interactuar con la base de datos a través del HAProxy.

### B. VM 2: Nube Central (Terminales Administrativas)
*   **Base de Datos:** **PostgreSQL 16** en esquema Maestro-Réplica. Sincronización mediante replicación física en streaming con `pg_basebackup`.
*   **Proxy Local:** **HAProxy** escuchando en el puerto `5432` encargado del enrutamiento de red de base de datos.
*   **Lenguaje/Backend:** **Python 3.10** utilizando las librerías `python-socketio`, `aiohttp` para el servidor asíncrono y `asyncpg` para la interacción asíncrona de alto rendimiento con PostgreSQL.

### C. VM 3: Nodo Central (Middleware, Bodega y Gateway)
*   **Base de Datos Central:** **PostgreSQL 16** en esquema Maestro-Réplica, administrado localmente.
*   **Middleware:** Servidor **Node.js/Express** encargado del enrutamiento de transacciones, normalización y colas de contingencia offline respaldadas por una base PostgreSQL local (`db-contingencia`).
*   **Aplicación 3 (Sistema de Bodega):** Servidor **Node.js** que gestiona el stock de medicamentos clínicos e insumos conectado a la base central PostgreSQL.

---

## 🛡️ 3. Tolerancia a Fallos y Alta Disponibilidad

El sistema implementa redundancia y mecanismos de resiliencia en tres niveles distintos:

### A. Capa de Aplicación (Balanceo y Failover de Nginx)
Nginx actúa como punto de entrada y balanceador mediante un bloque `upstream` configurado con políticas de backup:
*   Si la aplicación principal (`app-estaciones` en VM1 o `app-terminales` en VM2) se interrumpe, Nginx detecta el fallo tras **1 reintento** (`max_fails=1`) y redirige las solicitudes de manera transparente hacia la réplica de aplicación (`app-estaciones-replica` / `app-terminales-replica`) en menos de 5 segundos.

### B. Capa de Base de Datos (HAProxy)
Cada máquina virtual ejecuta un balanceador TCP local (HAProxy):
*   Las aplicaciones nunca se conectan directamente a una instancia específica de base de datos, sino al puerto local expuesto por HAProxy.
*   HAProxy realiza health checks TCP regulares cada 3 segundos. Si el Maestro falla, HAProxy redirige las consultas a la base de datos de respaldo (Réplica) de forma transparente.

### C. Capa de Integración / Comunicación (Cola de Contingencia PostgreSQL)
El **Middleware** implementa un búfer de contingencia local basado en **PostgreSQL** (`db-contingencia`):
*   Cuando la App 1 o la App 2 notifican transacciones (admisiones o diagnósticos/recetas), el Middleware intenta escribirlas inmediatamente en la Base de Datos Central PostgreSQL y notificar a Bodega.
*   Si la base PostgreSQL o la App de Bodega están caídas, el Middleware atrapa el error de conexión, guarda la petición con su correspondiente payload JSON en la tabla local PostgreSQL `cola_contingencia`, y devuelve un código de estado `PENDING`.
*   Un **worker en segundo plano** corre cada 10 segundos intentando vaciar la cola. Al detectar que el servicio vuelve a estar en línea, procesa las solicitudes pendientes de forma cronológica y limpia el búfer.

---

## 🔄 4. Flujo de Negocio Completo

1.  **Admisión (App 2):** El personal administrativo ingresa un paciente desde la web. La petición llega al WebSocket de la App 2, se persiste en PostgreSQL de la VM2 y, acto seguido, se envía una notificación HTTP POST asíncrona al Middleware en la VM3. El Middleware registra la admisión de forma centralizada en PostgreSQL.
2.  **Atención Médica (App 1):** El médico realiza la consulta, busca al paciente por su RUT (los datos se leen desde la base PostgreSQL local de la VM1) y actualiza el diagnóstico clínico. Al presionar guardar, los datos se actualizan en PostgreSQL y se envía una notificación HTTP POST al Middleware.
3.  **Procesamiento de Recetas y Descuento de Bodega:** El Middleware analiza el texto del diagnóstico. Si detecta palabras clave (ej: `"Paracetamol 500mg"` o `"Ibuprofeno 600mg"`), extrae el código del insumo correspondiente y hace una solicitud interna de descuento a la App 3 de Bodega. Esta reduce el inventario físico en la base de datos central de PostgreSQL.

---

## 🗂️ 5. Estructura del Monorepo

```
Proyecto-OSDS/
├── apps/                   # Aplicaciones y servicios del monorepo (gestión pnpm)
│   ├── estaciones-medicas/         # App 1: Backend de Estaciones Médicas (Node.js)
│   ├── terminales-administrativas/ # App 2: Backend de Terminales Administrativas (Python)
│   ├── app-bodega/                 # App 3: Sistema de Bodega (Node.js)
│   ├── middleware/                 # Middleware y cola de contingencia (Node.js/Express)
│   └── frontend/                   # Frontend SPA (HTML/JS)
├── docs/                   # Documentación técnica, diagramas y reportes
│   ├── diagrams/                   # Diagramas UML y png
│   ├── report/                     # LaTeX e informes finales
│   ├── documentacion.md            # Esta documentación técnica detallada
│   ├── pruebasTolerancia.md        # Guía interactiva de pruebas de tolerancia a fallos
│   └── guiaInfraestructura.md      # Guía detallada de la infraestructura
├── scripts/
│   └── rebuild-gcp-vms.sh  # Script bash de reconstrucción total en GCP
├── vms/                    # Configuración de red y contenedores para cada VM
│   ├── vm1-hospital/       # Orquestación y proxies locales de la VM 1
│   │   ├── config/
│   │   │   ├── db/                 # Scripts SQL de PostgreSQL Local
│   │   │   └── proxy/              # Configuración de HAProxy PostgreSQL Local
│   │   └── docker-compose.yml
│   │
│   ├── vm2-nube/           # Orquestación y proxies locales de la VM 2
│   │   ├── config/
│   │   │   ├── db/                 # Scripts SQL de PostgreSQL
│   │   │   └── proxy/              # Configuración de HAProxy PostgreSQL
│   │   └── docker-compose.yml
│   │
│   └── vm3-gateway/        # Orquestación, proxies y Nginx del Gateway
│       ├── config/
│       │   ├── db/                 # Scripts SQL de PostgreSQL Central
│       │   ├── nginx/              # Configuración de Nginx Reverse Proxy
│       │   └── proxy/              # Configuración de HAProxy PostgreSQL Central
│       └── docker-compose.yml
├── README.md               # Guía rápida de inicio
├── package.json            # Scripts de orquestación global
└── pnpm-workspace.yaml     # Configuración del workspace del monorepo
```
