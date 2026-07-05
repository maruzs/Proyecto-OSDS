# Distribución de Tareas - Proyecto 3: Sistemas Distribuidos

Este documento define la asignación equitativa y detallada de tareas para los 4 integrantes del equipo, cubriendo el ciclo completo de diseño, desarrollo, despliegue y pruebas del proyecto.

---

## 👩‍💻 Integrante 1: Krisstal Hernandez
**Rol:** Líder de Infraestructura, Redes Virtuales y Seguridad Perimetral

### Tareas Detalladas:
- [ ] **Configuración del Gateway y Nginx:**
  - Configurar Nginx en la VM3 como proxy inverso principal.
  - Implementar balanceo de carga tipo *Round Robin* o *Least Connections* para direccionar tráfico entre las instancias principales de la aplicación y sus réplicas (`app-estaciones` vs. `app-estaciones-replica`).
  - Configurar la gestión de códigos de error de red (redirección transparente con páginas de fallback HTTP 502/503 ante caídas de la app principal).
- [ ] **Túnel y Seguridad:**
  - Configurar y desplegar el contenedor de `cloudflare-tunnel` en la VM3 vinculando el subdominio del equipo de forma segura.
  - Aplicar políticas de Rate Limiting en Nginx para proteger los endpoints contra ataques de denegación de servicio.
- [ ] **Despliegue y Orquestación de Redes (Docker Compose):**
  - Diseñar los archivos de Docker Compose definitivos para cada una de las 3 VMs.
  - Crear un script Bash centralizado para automatizar el encendido, checkout de Git y despliegue rápido de los contenedores en GCP.

---

## 👨‍💻 Integrante 2: Mariano Muñoz
**Rol:** Desarrollador de Aplicación 1 (Clínica) y Administrador de Base de Datos MariaDB

### Tareas Detalladas:
- [ ] **Base de Datos MariaDB Tolerante a Fallos:**
  - Configurar un esquema de replicación MariaDB Maestro-Esclavo (Primary-Replica).
  - Implementar un orquestador o balanceador intermedio (ej. **ProxySQL** o un contenedor **HAProxy** con healthchecks activos) que detecte si el nodo MariaDB primario se cae y desvíe las consultas al nodo réplica automáticamente.
- [ ] **Desarrollo de Aplicación 1 (Estaciones Médicas - Node.js):**
  - Crear el servicio principal `app-estaciones` y su réplica `app-estaciones-replica`.
  - Asegurar la reconexión automática de la aplicación hacia el pool de MariaDB tras reconexiones.
- [ ] **Pruebas de Fallo en VM1:**
  - Validar el **Escenario de Prueba 1** (detención de `app-estaciones` principal) y **Escenario 2** (detención de MariaDB principal), generando logs legibles y capturas de pantalla para el informe.

---

## 👨‍💻 Integrante 3: Felipe Martinez
**Rol:** Desarrollador de Aplicación 2 (Administrativa/Remuneraciones) y Administrador de Base de Datos PostgreSQL

### Tareas Detalladas:
- [ ] **Desarrollo en Lenguaje Heterogéneo (Aplicación 2 - Python/FastAPI):**
  - Desarrollar el backend administrativo en un lenguaje distinto a Node.js (ej. Python con FastAPI) para cumplir la regla de heterogeneidad del enunciado.
  - Implementar el pool de conexiones y endpoints REST o sockets para gestionar la admisión de pacientes o sistema de remuneraciones.
  - Crear la instancia de aplicación principal y su réplica respectiva.
- [ ] **Base de Datos PostgreSQL Tolerante a Fallos:**
  - Configurar replicación física o lógica Postgres Maestro-Esclavo.
  - Implementar una herramienta de orquestación/failover (ej. **Pgpool-II** o **HAProxy + Keepalived**) encargada de enrutar las consultas y promover la réplica a master si el primario falla.
- [ ] **Pruebas de Fallo en VM2:**
  - Validar y documentar los escenarios de caída de la aplicación principal y caída del motor de base de datos PostgreSQL principal en la VM2.

---

## 👨‍💻 Integrante 4: Maximiliano Paredes
**Rol:** Desarrollador de Aplicación 3, Middleware y Diseñador de SLA/SLO (Informe LaTeX)

### Tareas Detalladas:
- [ ] **Desarrollo del Middleware (API Gateway / Data Broker):**
  - Crear el servicio de Middleware que actúe como puente entre la Aplicación 1, Aplicación 2 y la Aplicación 3.
  - Implementar la transformación de datos (ej. mapear formatos JSON, conversión de formatos de fechas y RUTs).
- [ ] **Desarrollo de Aplicación 3 y Tolerancia a Fallos del Middleware:**
  - Implementar la Aplicación 3 (ej. Sistema de Bodega o Inventario) con su réplica de base de datos.
  - Diseñar el mecanismo de tolerancia a fallos en App 1 y App 2 cuando el Middleware se cae (**Escenario 3**): por ejemplo, almacenamiento temporal en caché/cola local para posterior sincronización offline.
- [ ] **Redacción del SLA, SLO e Informe Final:**
  - Redactar formalmente las métricas acordadas de SLA y SLO.
  - Consolidar las secciones en el archivo LaTeX (`informe.tex`), estructurando la matriz de conectividad, diagramas de arquitectura actualizados y bitácoras de pruebas.

---

## 📅 Hitos de Integración y Pruebas Conjuntas
1. **Semana 1:** Despliegue de bases de datos con replicación en contenedores locales y primer borrador de APIs.
2. **Semana 2:** Conexión de aplicaciones locales con Middleware y orquestadores.
3. **Semana 3:** Despliegue en GCP (VMs limpias), integración de túnel de Cloudflare y Nginx.
4. **Semana 4:** Ejecución de pruebas de stress/caídas, ajuste de SLAs y entrega del informe final.
