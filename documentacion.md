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
│ ├─ HAProxy MariaDB       │                │ ├─ HAProxy PostgreSQL    │
│ ├─ MariaDB Master        │                │ ├─ PostgreSQL Master     │
│ └─ MariaDB Replica       │                │ └─ PostgreSQL Replica    │
└────────────┬─────────────┘                └────────────┬─────────────┘
             │ (HTTP POST)                               │ (HTTP POST)
             └─────────────────────┬─────────────────────┘
                                   ▼
                      ┌──────────────────────────┐
                      │ VM 3: Gateway / Central  │
                      ├──────────────────────────┤
                      │ ├─ Middleware API (MW)   │
                      │ │   └─ SQLite conting.   │
                      │ ├─ App 3: Bodega / Stock │
                      │ ├─ HAProxy MySQL         │
                      │ ├─ MySQL Central Master  │
                      │ └─ MySQL Central Replica │
                      └──────────────────────────┘
```

---

## 💻 2. Heterogeneidad de Base de Datos y Lenguajes

Para cumplir con las directivas de heterogeneidad e integración de sistemas heredados, cada nodo ejecuta una tecnología y lenguaje diferente:

### A. VM 1: Hospital Local (Estaciones Médicas)
*   **Base de Datos:** **MariaDB 10.11** configurada en esquema Maestro-Réplica. La replicación se realiza a nivel lógico mediante Logs Binarios (`mysql-bin`).
*   **Proxy Local:** **HAProxy** escuchando en el puerto `3306` que redirige consultas de lectura/escritura al Maestro y conmuta a la Réplica en caso de caída.
*   **Lenguaje/Backend:** **Node.js (JavaScript)** que utiliza el framework de WebSockets `socket.io` y el driver asíncrono `mysql2/promise` para interactuar con la base de datos a través del HAProxy.

### B. VM 2: Nube Central (Terminales Administrativas)
*   **Base de Datos:** **PostgreSQL 16** en esquema Maestro-Réplica. Sincronización mediante replicación física en streaming con `pg_basebackup`.
*   **Proxy Local:** **HAProxy** escuchando en el puerto `5432` encargado del enrutamiento de red de base de datos.
*   **Lenguaje/Backend:** **Python 3.10** utilizando las librerías `python-socketio`, `aiohttp` para el servidor asíncrono y `asyncpg` para la interacción asíncrona de alto rendimiento con PostgreSQL.

### C. VM 3: Nodo Central (Middleware, Bodega y Gateway)
*   **Base de Datos Central:** **MySQL 8.0** en esquema Maestro-Réplica, administrado localmente.
*   **Middleware:** Servidor **Node.js/Express** encargado del enrutamiento de transacciones, normalización y colas de contingencia offline.
*   **Aplicación 3 (Sistema de Bodega):** Servidor **Node.js** que gestiona el stock de medicamentos clínicos e insumos.

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

### C. Capa de Integración / Comunicación (Cola de Contingencia SQLite)
El **Middleware** implementa un búfer de contingencia local basado en **SQLite** (`contingencia.db`):
*   Cuando la App 1 o la App 2 notifican transacciones (admisiones o diagnósticos/recetas), el Middleware intenta escribirlas inmediatamente en la Base de Datos Central MySQL y notificar a Bodega.
*   Si la base MySQL o la App de Bodega están caídas, el Middleware atrapa el error de conexión, guarda la petición con su correspondiente payload JSON en la tabla local SQLite `cola_contingencia`, y devuelve un código de estado `PENDING`.
*   Un **worker en segundo plano** corre cada 10 segundos intentando vaciar la cola. Al detectar que el servicio vuelve a estar en línea, procesa las solicitudes pendientes de forma cronológica y limpia el búfer.

---

## 🔄 4. Flujo de Negocio Completo

1.  **Admisión (App 2):** El personal administrativo ingresa un paciente desde la web. La petición llega al WebSocket de la App 2, se persiste en PostgreSQL de la VM2 y, acto seguido, se envía una notificación HTTP POST asíncrona al Middleware en la VM3. El Middleware registra la admisión de forma centralizada en MySQL.
2.  **Atención Médica (App 1):** El médico realiza la consulta, busca al paciente por su RUT (los datos se leen desde la base MariaDB local de la VM1) y actualiza el diagnóstico clínico. Al presionar guardar, los datos se actualizan en MariaDB y se envía una notificación HTTP POST al Middleware.
3.  **Procesamiento de Recetas y Descuento de Bodega:** El Middleware analiza el texto del diagnóstico. Si detecta palabras clave (ej: `"Paracetamol 500mg"` o `"Ibuprofeno 600mg"`), extrae el código del insumo correspondiente y hace una solicitud interna de descuento a la App 3 de Bodega. Esta reduce el inventario físico en la base de datos central de MySQL.

---

## 🗂️ 5. Estructura del Monorepo

```
Proyecto-OSDS/
├── diagrama/
│   └── arqui.puml          # Diagrama UML de la arquitectura Unidad 3
├── scripts/
│   └── rebuild-gcp-vms.sh  # Script bash de reconstrucción total en GCP
├── vms/
│   ├── vm1-hospital/       # Configuración y código de VM1
│   │   ├── apps/
│   │   │   └── estaciones-medicas/   # Backend Node.js
│   │   ├── config/
│   │   │   ├── db/                   # Scripts SQL MariaDB
│   │   │   └── proxy/                # Configuración HAProxy
│   │   └── docker-compose.yml        # Orquestación VM1
│   │
│   ├── vm2-nube/           # Configuración y código de VM2
│   │   ├── apps/
│   │   │   └── terminales-administrativas/ # Backend Python
│   │   ├── config/
│   │   │   ├── db/                   # Scripts SQL Postgres
│   │   │   └── proxy/                # Configuración HAProxy
│   │   └── docker-compose.yml        # Orquestación VM2
│   │
│   └── vm3-gateway/        # Configuración y código de VM3
│       ├── apps/
│       │   ├── frontend/             # SPA Cliente (HTML/JS)
│       │   ├── middleware/           # API Middleware (Node.js)
│       │   └── app-bodega/           # App 3 de Bodega (Node.js)
│       ├── config/
│       │   ├── db/                   # Scripts SQL MySQL Central
│       │   ├── nginx/                # Configuración Nginx Proxy
│       │   └── proxy/                # Configuración HAProxy MySQL
│       └── docker-compose.yml        # Orquestación VM3
│
├── README.md               # Documentación rápida e inicio rápido
├── documentacion.md        # Esta documentación técnica detallada
└── pruebasTolerancia.md    # Guía interactiva paso a paso de tolerancia a fallos
```
