# Simulador de Centro de Salud Multientorno - Proyecto Unidad 2

Este repositorio contiene el diseño e implementación de la **infraestructura transversal** y el **mecanismo de datos** para el Proyecto de la Unidad 2 de la asignatura **Sistemas Operativos y Distribuidos**. 

El sistema simula un entorno de salud híbrido distribuido, estableciendo un límite de seguridad y aislamiento entre un **Hospital Local** (Entorno Físico) y el **Entorno Nube** (Remoto), comunicados de forma segura a través de WebSockets y sincronizados de forma asíncrona y bidireccional mediante replicación lógica en PostgreSQL 16.

---

## 🏗️ Arquitectura de Red y Seguridad

La infraestructura está compuesta por tres redes virtuales internas aisladas (driver `bridge` de Docker):
*   **`hospital_net`**: Red local aislada para las estaciones médicas de trabajo e historial clínico local (`db-local`).
*   **`cloud_net`**: Red remota que simula el entorno de nube (GCP) para el terminal de admisiones administrativas e historial en nube (`db-nube`).
*   **`dmz_net`**: Zona desmilitarizada perimetral. Conecta directamente a `nginx-proxy` con el mundo exterior y sirve como canal exclusivo y seguro de tránsito de replicación directa entre `db-local` y `db-nube`.

### Diagrama de Flujo y Redes

```text
       [ Cliente Web / Navegador ]
                   │
                   ▼ (Puertos 80 / 443)
            ┌──────────────┐
            │  nginx-proxy │ (DMZ Net)
            └──────┬───────┘
                   │
         ┌─────────┴─────────┐
         ▼ (hospital_net)    ▼ (cloud_net)
┌─────────────────┐       ┌─────────────────┐
│ app-estaciones  │       │ app-terminales  │  <-- Módulos de Aplicación (Placeholder)
└────────┬────────┘       └────────┬────────┘
         │ (Puerto 5432)           │ (Puerto 5432)
┌────────▼────────┐       ┌────────▼────────┐
│    db-local     │ <====>│    db-nube      │  <-- Replicación Lógica Asíncrona (dmz_net)
└─────────────────┘       └─────────────────┘
```

---

## 🗂️ Estructura del Proyecto

El repositorio está organizado de forma modular, cumpliendo estrictamente con el rol del **Integrante 3 (DevOps)**:

```bash
.
├── estaciones-medicas/             # Módulo del Integrante 1 (Placeholder)
│   └── Dockerfile                  # Construcción mínima de entorno
├── terminales-administrativas/     # Módulo del Integrante 2 (Placeholder)
│   └── Dockerfile                  # Construcción mínima de entorno
├── docker-compose.yml              # Orquestador general de servicios
├── nginx.conf                      # Configuración del proxy inverso y WebSocket
├── init-local.sql                  # Inicialización esquema y publicación local
├── init-nube.sql                   # Inicialización esquema, publicación y suscripción remota
└── README.md                       # Documentación del proyecto (Este archivo)
```

---

## ⚙️ Componentes de Infraestructura

### 1. Orquestación (`docker-compose.yml`)
Define los cinco servicios que participan en la simulación:
*   `db-local` y `db-nube` corriendo PostgreSQL 16-alpine con persistencia y configuración de nivel WAL lógico (`wal_level=logical`, `max_replication_slots=10`, `max_wal_senders=10`).
*   `app-estaciones` y `app-terminales` con builds parametrizados, variables de entorno inyectadas para la conexión segura a sus respectivas bases de datos, y aislamiento en sus redes correspondientes.
*   `nginx-proxy` exponiendo los puertos 80 y 443.

### 2. Seguridad y Gateway (`nginx.conf`)
*   Redirecciona el tráfico entrante hacia `/ws-medicas/` a `app-estaciones:8001` y `/ws-administrativas/` a `app-terminales:8002`.
*   Implementa los encabezados HTTP requeridos para negociar el protocolo WebSocket (`Upgrade`, `Connection`, `Host`, `X-Real-IP`, `X-Forwarded-For`).
*   Incluye un bloque secundario comentado para el puerto 443 preparado técnicamente con directivas de certificados SSL nativos para la migración final en Google Cloud Compute Engine.

### 3. Modelo de Datos y Replicación Lógica (`init-local.sql` / `init-nube.sql`)
Ambas bases de datos cargan de manera idéntica el esquema de la tabla de registros clínicos:
```sql
CREATE TABLE fichas_pacientes (
    id UUID PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    diagnostico TEXT,
    origen_registro VARCHAR(50) NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Estrategia para evitar bucles infinitos (Hito 2):
Para evitar ciclos infinitos donde un dato replicado se re-publique de vuelta al nodo origen:
1.  **Filtros de fila en publicaciones:**
    *   La base local define su publicación para enviar únicamente datos de origen local:
        `CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes WHERE (origen_registro = 'local');`
    *   La base en la nube define su publicación para enviar únicamente datos de origen en la nube:
        `CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes WHERE (origen_registro = 'nube');`
    Como el campo `origen_registro` se replica pero no cambia, los datos replicados no serán capturados por la publicación de retorno.
2.  **Cláusula de Origen en la Suscripción (`origin = none`):**
    Establecer la opción `origin = none` al crear las suscripciones bidireccionales le indica a PostgreSQL que solo debe importar cambios que se originaron localmente en el publicador y no cambios importados de otros nodos. Esta opción requiere **PostgreSQL 16+**, por lo que la infraestructura ha sido configurada con la imagen de PostgreSQL 16.

---

## 🚀 Despliegue de la Infraestructura

Para levantar todo el entorno transversal (bases de datos, proxy y contenedores de aplicación base):

```bash
docker compose up --build -d
```

### Comprobación de Servicios
Una vez ejecutado, puedes verificar el estado de los contenedores mediante:
```bash
docker compose ps
```

Puedes inspeccionar los logs de inicio de replicación en la nube para comprobar el estado de la suscripción `sub_desde_local`:
```bash
docker compose logs db-nube
```
