# CHECKLIST.md (Plan de Acción Paso a Paso)

### Fase 1: Infraestructura de Red y Servidores (GCP) - _Responsable: Integrante 3_

- [ ] Crear red VPC en GCP y subred para el proyecto.
- [ ] Configurar reglas de firewall internas:
  - [ ] Permitir puerto `5432` (PostgreSQL) únicamente entre VM 1 y VM 2.
  - [ ] Permitir puertos `8001` y `8002` (WebSockets) desde VM 3 hacia VM 1 y VM 2.
- [ ] Configurar reglas de firewall externas:
  - [ ] Permitir puertos `80` (HTTP) y `443` (HTTPS) de forma pública en VM 3.
- [ ] Crear las 3 VMs de Compute Engine (`e2-medium` o `e2-micro`, Debian 11/12):
  - [ ] **VM 1 (Hospital Local):** IP fija interna (ej. `10.128.0.10`).
  - [ ] **VM 2 (Nube Central):** IP fija interna (ej. `10.128.0.20`).
  - [ ] **VM 3 (Gateway & Frontend):** IP externa pública estática + IP fija interna (ej. `10.128.0.30`).
- [ ] Instalar Docker y Docker Compose V2 en las 3 VMs.

### Fase 2: Configuración del Nodo Local (VM 1) - _Responsables: Integrante 1 e Integrante 3_

- [ ] Clonar el repositorio en la **VM 1**.
- [ ] Levantar el contenedor de la Base de Datos `db-local`:
  - [ ] Cargar esquema inicial (`init-local.sql`).
  - [ ] Validar que corra en PostgreSQL 16 con `wal_level = logical`.
  - [ ] Crear usuario de base de datos con privilegios mínimos (ej. `app_user_local` con accesos restringidos a SELECT/INSERT/UPDATE en `fichas_pacientes`).
- [ ] Levantar el contenedor `app-estaciones`:
  - [ ] Comprobar conexión local con `db-local` usando el usuario de privilegios mínimos.
  - [ ] Implementar la validación de rol (Médico o Enfermero) en los eventos de WebSocket (`consultar_paciente`, `actualizar_diagnostico`).
  - [ ] Verificar que el servidor de Socket.io escuche correctamente en el puerto `8001`.

### Fase 3: Configuración del Nodo Nube (VM 2) - _Responsables: Integrante 2 e Integrante 3_

- [ ] Clonar el repositorio en la **VM 2**.
- [ ] Levantar el contenedor de la Base de Datos `db-nube`:
  - [ ] Cargar esquema inicial (`init-nube.sql`).
  - [ ] Validar que corra en PostgreSQL 16 con `wal_level = logical`.
  - [ ] Crear usuario de base de datos con privilegios mínimos (ej. `app_user_nube` con accesos restringidos a SELECT/INSERT/UPDATE en `fichas_pacientes`).
- [ ] Levantar el contenedor `app-terminales`:
  - [ ] Comprobar conexión local con `db-nube` usando el usuario de privilegios mínimos.
  - [ ] Implementar la validación de rol (Administrativo) en los eventos de WebSocket (`admitir_paciente`).
  - [ ] Verificar que el servidor de Socket.io escuche correctamente en el puerto `8002`.

### Fase 4: Sincronización y Replicación Lógica - _Responsable: Integrante 3_

- [ ] En **VM 1 (db-local)**: Crear la publicación para datos locales (`pub_local_a_nube`).
- [ ] En **VM 2 (db-nube)**: Crear la publicación para datos en la nube (`pub_nube_a_local`).
- [ ] En **VM 2 (db-nube)**: Suscribirse a la publicación de la VM 1 apuntando a la IP privada de la VM 1:
  - [ ] `CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=10.128.0.10 ...' ...`
- [ ] En **VM 1 (db-local)**: Suscribirse a la publicación de la VM 2 apuntando a la IP privada de la VM 2:
  - [ ] `CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=10.128.0.20 ...' ...`
- [ ] Validar la sincronización en ambas direcciones y confirmar la exclusión de bucles con `origin = none`.

### Fase 5: Configuración de Gateway y Entrada (VM 3) - _Responsables: Integrante 4 e Integrante 3_

- [ ] Clonar el repositorio en la **VM 3**.
- [ ] Modificar el Frontend (`apps/frontend/index.html`):
  - [ ] Agregar vista de login básico (simulando autenticación) para que el trabajador seleccione su Rol (Médico, Enfermero o Administrativo).
  - [ ] Adjuntar el token o rol seleccionado en el payload de conexión inicial de Socket.io.
- [ ] Modificar `nginx.conf` para cambiar las directivas `proxy_pass` usando las IPs privadas reales de las VMs:
  - [ ] Redirigir `/ws-medicas` a `http://10.128.0.10:8001`.
  - [ ] Redirigir `/ws-administrativas` a `http://10.128.0.20:8002`.
- [ ] Copiar los archivos del frontend estático (`apps/frontend/*`) al directorio raíz web de Nginx en VM 3.
- [ ] Levantar el contenedor `nginx-proxy` en la VM 3.
- [ ] Configurar medidas de rate-limiting y cabeceras de seguridad.

### Fase 6: Pruebas de Sistema Integrado y QA - _Responsable: Integrante 4 (Apoyado por todos)_

- [ ] Probar el acceso web a la IP pública de la **VM 3**.
- [ ] Verificar la negociación correcta de WebSocket en tiempo real para consultas y admisiones.
- [ ] Simular desconexión temporal de la VM 1, ingresar pacientes en VM 2 y verificar que los datos se sincronicen asíncronamente al reconectar la VM 1.
- [ ] Tomar capturas de pantalla de los paneles, bases de datos y terminales para el Informe del Proyecto.
- [ ] Consolidar la documentación en el informe final y preparar la presentación del 9 de junio.
