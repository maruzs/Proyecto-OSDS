# Plan de Implementación - Restauración de Heterogeneidad, Login y Nginx Proxy Manager (NPM)

Este plan detalla los pasos para revertir la base de datos a su topología heterogénea original (MariaDB, PostgreSQL, MySQL), implementar la pantalla de Login con Roles y agregar Nginx Proxy Manager en el Gateway.

---

## 🏗️ 1. Restauración de Bases de Datos Heterogéneas

Para no perder el trabajo del compañero, modificaremos las configuraciones de Docker Compose y los drivers de conexión en los backends correspondientes, manteniendo intactas las lógicas y correcciones de código existentes:

```mermaid
graph TD
    App1[Estaciones Médicas (Node.js)] -->|mysql2| MariaDB[MariaDB Master/Replica (VM1)]
    App2[Terminales Admisión (Python)] -->|asyncpg| Postgres[PostgreSQL Master/Replica (VM2)]
    MW[Middleware (Node.js)] -->|mysql2| MySQL[MySQL Central Master/Replica (VM3)]
    MW -->|pg| DBCont[PostgreSQL Contingencia (VM3)]
```

*   **VM1 (Hospital Local):** Cambiar de PostgreSQL a **MariaDB 10.11** (Master, Replica y HAProxy). Actualizar `apps/estaciones-medicas` para usar `mysql2` en lugar de `pg`.
*   **VM2 (Nube Central):** Mantener **PostgreSQL** (Master, Replica y HAProxy) con la aplicación en Python.
*   **VM3 (Gateway / Central):** Cambiar `db-central-master` and `db-central-replica` de PostgreSQL a **MySQL 8.0** con su correspondiente proxy HAProxy. Mantener `db-contingencia` en **PostgreSQL**. Actualizar `app-bodega` and `middleware` para usar `mysql2` al conectarse a la base central.

---

## 🔐 2. Pantalla de Inicio de Sesión con Roles (Login)

Implementaremos un sistema de inicio de sesión seguro en el Frontend común:
*   **Roles Permitidos:** `Administrativo`, `Medico`, `Enfermero`.
*   **Control de Acceso:**
    *   `Administrativo`: Único rol con acceso para admitir pacientes.
    *   `Medico`: Único rol con acceso para actualizar diagnósticos y emitir recetas.
    *   `Enfermero`: Puede visualizar fichas y diagnósticos, pero no modificarlos.
*   **Implementación:** Se agregará un formulario de Login en la raíz del frontend que valida credenciales seguras de manera local o mediante tokens simulados, cargando la vista correspondiente a cada rol.

---

## 🌐 3. Nginx Proxy Manager con Interfaz Gráfica

Reemplazaremos el contenedor de Nginx por **Nginx Proxy Manager (NPM)** en la VM3:
*   **Servicio NPM:** Contenedor `jc21/nginx-proxy-manager:latest` exponiendo el puerto `80`, `443` y `81` (panel de administración).
*   **Túnel de Cloudflare:** Mapear el nuevo subdominio `adminosds.epistia.cl` hacia `http://nginx-proxy-manager:81`.
