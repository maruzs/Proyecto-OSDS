# Plan de Implementación - Punto 2: Base de Datos PostgreSQL (Maestro-Réplica) y Aplicación Heterogénea en Python (VM2)

Este plan detalla los pasos para configurar la base de datos de la **Nube Central (VM2)** con tolerancia a fallos mediante **PostgreSQL (Maestro-Réplica)** y un balanceador **HAProxy**, además de migrar la **Aplicación 2 (Terminales Administrativas)** a **Python** para cumplir con el requerimiento de heterogeneidad de lenguajes de programación.

---

## 🏗️ Estructura Propuesta para la VM2

Reestructuraremos los servicios de la VM2 para incluir tolerancia a fallos en la base de datos y correr la aplicación en Python:

```mermaid
graph TD
    App[Aplicación 2: Terminales Administrativas (Python)] -->|Puerto 5432| Proxy[db-nube-proxy: HAProxy]
    Proxy -->|Escribe / Lee| Master[db-nube-master: PostgreSQL 16]
    Master -->|Replicación Lógica / Física| Replica[db-nube-replica: PostgreSQL 16]
    Proxy -.->|Fallback / Lectura si Master cae| Replica
```

1. **`db-nube-master` (Postgres Primario):** Instancia principal que almacena y publica las admisiones.
2. **`db-nube-replica` (Postgres Réplica):** Réplica que consume los logs de transacciones del maestro.
3. **`db-nube-proxy` (HAProxy):** Proxy TCP expuesto en el puerto `5432` que redirige el tráfico hacia el maestro y maneja failover.
4. **`app-terminales` (FastAPI / Python-SocketIO):** Backend migrado a Python.

---

## 🛠️ Cambios Propuestos por Componente

### 1. [MODIFY] [docker-compose.yml](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm2-nube/docker-compose.yml)
*   Reemplazar la base de datos única por `db-nube-master`, `db-nube-replica` y `db-nube-proxy` (HAProxy).
*   Modificar la definición de `app-terminales` para construir desde el nuevo entorno de Python.
*   Actualizar las variables de entorno para que apunten a `db-nube-proxy:5432`.

### 2. [NEW] [haproxy.cfg](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm2-nube/config/proxy/haproxy.cfg)
*   Configurar HAProxy para escuchar en el puerto `5432`.
*   Definir health checks TCP para `db-nube-master` y `db-nube-replica` (backup).

### 3. [NEW] [server.py](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm2-nube/apps/terminales-administrativas/server.py)
*   Implementar el servidor Socket.io en Python utilizando `python-socketio` y `aiohttp` / `asyncio`.
*   Conectar al pool de Postgres usando `asyncpg` para consultas asíncronas de alta velocidad.
*   Mantener las reglas de seguridad (RBAC) verificando el rol `administrativo` antes de insertar.
*   Insertar con origen de registro marcado como `nube` para habilitar la replicación selectiva entre VMs.

### 4. [NEW] [requirements.txt](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm2-nube/apps/terminales-administrativas/requirements.txt)
*   Definir las dependencias: `python-socketio`, `asyncpg`, `aiohttp`, `cryptography`.

### 5. [NEW] [Dockerfile](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm2-nube/apps/terminales-administrativas/Dockerfile)
*   Reescribir el Dockerfile utilizando una imagen base liviana de Python (`python:3.10-slim`).
*   Instalar las dependencias y ejecutar `python server.py`.

---

## 🧪 Plan de Verificación y Pruebas

### Paso 1: Verificación de la Aplicación en Python
*   Correr localmente con Docker y conectarse al puerto `8002`.
*   Enviar un evento de prueba `admitir_paciente` y comprobar que se inserta correctamente en la base de datos PostgreSQL.
*   Probar el filtro de seguridad enviando roles no autorizados (ej. "medico") y verificar el rechazo de la transacción.

### Paso 2: Prueba de Tolerancia a Fallos de BD en VM2
*   Detener `db-nube-master`.
*   Verificar que HAProxy enruta las solicitudes a `db-nube-replica` de forma transparente.
