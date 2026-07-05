# Plan de Implementación - Punto 3: Middleware, Aplicación 3 (Bodega/Inventario) y DB Central (MySQL Master-Replica) (VM3)

Este plan detalla el diseño e implementación del **Middleware** y del tercer módulo del centro médico (**Aplicación 3: Sistema de Bodega e Inventario**) que interactuará con la base de datos central en la **VM3**, completando el ecosistema distribuido y tolerante a fallos.

---

## 🏗️ Estructura Propuesta de Comunicación y Redes (VM3)

El **Middleware** y la **Aplicación 3** correrán en la VM3 (Gateway). Las conexiones se realizarán de la siguiente manera:

```mermaid
graph TD
    App1[Aplicación 1: Estaciones Clínicas (VM1)] -->|API REST / WS| MW[Middleware (VM3)]
    App2[Aplicación 2: Terminales Admisión (VM2)] -->|API REST / WS| MW
    MW -->|Transforma y Enruta| App3[Aplicación 3: Sistema Bodega (VM3)]
    App3 -->|Puerto 3306| DBProxy[db-central-proxy: HAProxy]
    DBProxy -->|Escritura / Lectura| DBMaster[db-central-master: MySQL]
    DBMaster -->|Replicación Física| DBReplica[db-central-replica: MySQL]
```

1. **El Middleware (API Gateway & Transformación):**
   * Recibe las peticiones de actualización de diagnóstico (App 1) y registro de paciente (App 2).
   * Valida y transforma los datos (ej. normaliza RUTs, formatos de fechas y asigna códigos de insumos).
   * **Tolerancia a fallos:** Si la Aplicación 3 o la Base de Datos Central no están disponibles, el Middleware almacena las peticiones pendientes en una cola local SQLite de contingencia y reintenta la sincronización automáticamente cada 10 segundos.

2. **Aplicación 3 (Sistema de Bodega e Insumos):**
   * Representa el módulo de inventarios del hospital.
   * Recibe notificaciones del Middleware para descontar insumos médicos del stock (asociados a recetas de pacientes) o registrar el consumo de recursos.
   * Se conecta a la base de datos central a través de un proxy HAProxy.

3. **Base de Datos Central (MySQL Maestro-Réplica):**
   * Configurada en la VM3 con una instancia maestra (`db-central-master`) y una réplica (`db-central-replica`) para auditoría y alta disponibilidad.

---

## 🛠️ Cambios Propuestos por Componente

### 1. [MODIFY] [docker-compose.yml](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm3-gateway/docker-compose.yml)
*   Integrar las variables de entorno de Cloudflare Tunnel usando el token en el archivo `.env`.
*   Agregar el servicio `middleware` (Express.js / Node.js).
*   Agregar la `app-bodega` (Aplicación 3).
*   Agregar `db-central-master` (MySQL), `db-central-replica` (MySQL) y su proxy HAProxy.

### 2. [NEW] [server.js (Middleware)](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm3-gateway/apps/middleware/server.js)
*   Desarrollar un backend Express/Node.js que exponga endpoints REST:
    *   `POST /api/mw/pacientes` (recibe de App 2 y mapea a base central).
    *   `POST /api/mw/diagnosticos` (recibe de App 1, extrae recetas e invoca a Bodega).
*   Implementar la base de datos local SQLite (`contingencia.db`) para almacenar transacciones pendientes de envío si la App 3 o DB están fuera de línea.

### 3. [NEW] [app.js (Aplicación 3)](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm3-gateway/apps/app-bodega/app.js)
*   Servicio Node.js que exponga el endpoint `POST /api/inventario/descontar` para restar stock de insumos clínicos de la base de datos central.

### 4. [NEW] [init-central.sql](file:///home/maruzs/Desktop/Uni/OSDS/Proyecto-OSDS/vms/vm3-gateway/config/db/init-central.sql)
*   Esquema de la base de datos central en MySQL con tablas `registro_admisiones`, `auditoria_diagnosticos` e `inventario_insumos` precargada con stock inicial.

---

## 🧪 Plan de Verificación y Pruebas

### Escenario 1: Flujo de Negocio Completo
1. Registrar un paciente en la App 2 (VM2).
2. Comprobar que el Middleware normaliza el registro y lo inserta en la base central (VM3).
3. Desde la App 1 (VM1), consultar al paciente y actualizar el diagnóstico (receta médica).
4. Comprobar que el Middleware recibe la receta y notifica a la App 3 (Bodega) para reducir el stock en MySQL.

### Escenario 2: Simulación de Caída del Middleware
1. Detener el contenedor del Middleware.
2. Comprobar en los logs de la App 1 y la App 2 que detectan la falta de conectividad y degradan su funcionamiento avisando al usuario.

### Escenario 3: Caída de la App 3 (Bodega) con Recuperación Offline en Middleware
1. Detener la `app-bodega`.
2. Actualizar un diagnóstico en la App 1.
3. Comprobar que el Middleware almacena el consumo de stock en `contingencia.db` y sigue respondiendo "Pendiente".
4. Iniciar la `app-bodega`.
5. Verificar que el Middleware procesa la cola de contingencia y actualiza el inventario en MySQL de forma retroactiva.
