# Distribución de Tareas - Proyecto 3: Sistemas Distribuidos

Este documento define la asignación equitativa y detallada de tareas para los 4 integrantes del equipo, cubriendo el ciclo completo de diseño, desarrollo, despliegue y pruebas del proyecto.

---

## 👩‍💻 Integrante 1: Krisstal Hernandez
**Rol:** Líder de Infraestructura, Redes Virtuales y Seguridad Perimetral

### Tareas Detalladas:
- [x] **Configuración del Gateway y Nginx:**
  - Configurar Nginx en la VM3 como proxy inverso principal.
  - Implementar balanceo de carga tipo *Backup/Failover* para direccionar tráfico entre las instancias principales de la aplicación y sus réplicas (`app-estaciones` vs. `app-estaciones-replica`).
  - Configurar la gestión de códigos de error de red (redirección transparente con failover automático al servidor de backup).
- [x] **Túnel y Seguridad:**
  - Configurar y desplegar el contenedor de `cloudflare-tunnel` en la VM3 vinculando el subdominio del equipo (`osds.epistia.cl`) de forma segura.
  - Aplicar políticas de Rate Limiting en Nginx (`limit_req_zone` 10 req/s por IP, burst=15).
- [x] **Despliegue y Orquestación de Redes (Docker Compose):**
  - Diseñar los archivos de Docker Compose definitivos para cada una de las 3 VMs (`vms/vm1-hospital/`, `vms/vm2-nube/`, `vms/vm3-gateway/`).
  - Crear script Bash centralizado (`scripts/rebuild-gcp-vms.sh`) para automatizar el encendido, checkout de Git y despliegue en GCP.

---

## 👨‍💻 Integrante 2: Mariano Muñoz
**Rol:** Desarrollador de Aplicación 1 (Clínica) y Administrador de Base de Datos MariaDB

### Tareas Detalladas:
- [x] **Base de Datos MariaDB Tolerante a Fallos:**
  - Configurar esquema de replicación MariaDB Maestro-Réplica (`--server-id`, `--log-bin`, binlog-format=ROW).
  - Implementar HAProxy (`db-local-proxy`) con healthchecks activos que detecta si el nodo MariaDB primario se cae y desvía las consultas al nodo réplica automáticamente.
- [x] **Desarrollo de Aplicación 1 (Estaciones Médicas - Node.js):**
  - Crear el servicio principal `app-estaciones` y su réplica `app-estaciones-replica`.
  - Implementar eventos WebSocket: `consultar_paciente` y `actualizar_diagnostico`.
  - Notificación asíncrona al Middleware al actualizar diagnósticos.
  - Reconexión automática de la aplicación hacia el pool de MariaDB.
- [x] **Pruebas de Fallo en VM1:**
  - Validar **Escenario de Prueba 1** (detención de `app-estaciones` principal) y **Escenario 2** (detención de MariaDB principal).
  - Logs reales documentados en `docs/logs.md`.

---

## 👨‍💻 Integrante 3: Felipe Martinez
**Rol:** Desarrollador de Aplicación 2 (Administrativa) y Administrador de Base de Datos PostgreSQL

### Tareas Detalladas:
- [x] **Desarrollo en Lenguaje Heterogéneo (Aplicación 2 - Python):**
  - Desarrollar el backend administrativo en **Python 3.10** con `aiohttp` + `python-socketio` + `asyncpg`.
  - Implementar RBAC: solo rol `administrativo` puede admitir pacientes.
  - Notificación al Middleware al admitir pacientes.
  - Crear la instancia de aplicación principal y su réplica (`app-terminales-replica`).
- [x] **Base de Datos PostgreSQL Tolerante a Fallos:**
  - Configurar replicación física PostgreSQL Maestro-Réplica con `pg_basebackup`.
  - Implementar HAProxy (`db-nube-proxy`) para enrutar consultas y conmutar a réplica si el primario falla.
- [x] **Pruebas de Fallo en VM2:**
  - Validar y documentar la caída de la aplicación principal y del motor PostgreSQL.
  - Logs reales documentados en `docs/logs.md`.

---

## 👨‍💻 Integrante 4: Maximiliano Paredes
**Rol:** Desarrollador de Aplicación 3, Middleware y Diseñador de SLA/SLO

### Tareas Detalladas:
- [x] **Desarrollo del Middleware (API Gateway / Data Broker):**
  - Crear el servicio Middleware (Node.js/Express, puerto 8000) que actúa como puente entre App 1, App 2 y App 3.
  - Implementar transformación de datos y análisis de recetas médicas.
  - Endpoints: `POST /api/mw/pacientes` y `POST /api/mw/diagnosticos`.
- [x] **Desarrollo de Aplicación 3 y Cola de Contingencia:**
  - Implementar el Sistema de Bodega (`app-bodega`, Node.js, puerto 8003) con endpoints de inventario y descuento de insumos.
  - Diseñar y programar la cola de contingencia SQLite (`contingencia.db`) con worker de sincronización cada 10 segundos.
  - Configurar MySQL 8.0 en Maestro-Réplica con HAProxy (`db-central-proxy`).
- [x] **Redacción del SLA, SLO e Informe Final:**
  - Redactar formalmente las métricas de SLA y SLO → `docs/sla-slo.md`.
  - Consolidar el informe final en LaTeX → `docs/report/informeFinal.tex` con pruebas, arquitectura de Unidad 3 y sección de SLA/SLO.

---

## 📅 Hitos de Integración y Estado

| Hito | Estado |
|------|--------|
| Semana 1: Bases de datos con replicación en contenedores | ✅ Completado |
| Semana 2: Conexión de aplicaciones con Middleware y orquestadores | ✅ Completado |
| Semana 3: Despliegue en GCP (VMs limpias), Cloudflare Tunnel, Nginx | ✅ Completado |
| Semana 4: Pruebas de tolerancia a fallos, SLA/SLO e informe final | ✅ Completado |

---

## 📋 Entregables — Estado Final

| Entregable | Archivo | Estado |
|------------|---------|--------|
| Informe borrador (Entrega 1) | `docs/report/informe.tex` | ✅ Entregado el 30-06-2026 |
| **Informe final (Entrega 2)** | `docs/report/informeFinal.tex` | ✅ Listo para presentar |
| **Propuesta SLA** | `docs/sla-slo.md` | ✅ Documento formal completo |
| **Propuesta SLO** | `docs/sla-slo.md` | ✅ Incluido en sla-slo.md |
| Documentación técnica | `docs/documentacion.md` | ✅ Completa |
| Guía de pruebas | `docs/pruebasTolerancia.md` | ✅ Completa con procedimientos |
| Logs reales de despliegue | `docs/logs.md` | ✅ Logs GCP reales capturados |
| Distribución de roles | `docs/tareas.md` | ✅ Este archivo |
