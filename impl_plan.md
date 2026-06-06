# Plan de Implementación: Sistema Médico Distribuido en GCP

Este documento detalla la reestructuración del proyecto para pasar de un entorno de desarrollo de máquina única (monolítica con Docker) a una **arquitectura distribuida multizona y multinodo real en Google Cloud Platform (GCP)**. Esto cumple con los objetivos de la asignatura de **Sistemas Operativos y Distribuidos**.

---

## 📐 Diseño de Arquitectura Distribuida (GCP)

Para simular de manera real el entorno distribuido (Hospital Local vs. Nube Central), crearemos **3 Máquinas Virtuales (VMs)** en GCP dentro de la misma Red de VPC, permitiendo la comunicación privada entre ellas y un único punto de entrada público.

```text
                                  [ Cliente Web / Navegador ]
                                               │
                                               ▼ (HTTP/HTTPS - Puerto 80/443 Público)
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ VM 3: Gateway & Seguridad (Nginx Proxy + Frontend)                                     │
  │ IP Pública: 34.XX.XX.XX (Acceso Global)                                                │
  └──────────────┬──────────────────────────────────────────┬──────────────────────────────┘
                 │ (Internal IP: Puerto 8001)               │ (Internal IP: Puerto 8002)
                 ▼                                          ▼
  ┌──────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
  │ VM 1: Hospital Local (Edge)              │   │ VM 2: Nube Central (Core)               │
  │ IP Privada: 10.128.0.10                  │   │ IP Privada: 10.128.0.20                 │
  │                                          │   │                                         │
  │  - app-estaciones (WebSocket :8001)      │   │  - app-terminales (WebSocket :8002)     │
  │  - db-local (PostgreSQL :5432)           │   │  - db-nube (PostgreSQL :5432)           │
  └──────────────────────┬───────────────────┘   └───────────────────┬─────────────────────┘
                         │                                           │
                         └───────────────── Replicación ─────────────┘
                                   (Puerto 5432 - Red Interna)
```

### Detalle de las VMs a crear en GCP:

1. **VM 1: Hospital Local (Edge Node)**
   - **Propósito:** Simula la infraestructura física dentro del establecimiento médico.
   - **Servicios:**
     - `db-local` (PostgreSQL 16) con almacenamiento local de fichas clínicas de alta demanda.
     - `app-estaciones` (Servidor de aplicaciones en Node.js que gestiona las fichas a través de WebSockets).
   - **Acceso:** Solo accesible internamente por la base de datos de la nube (para replicación) y por el Gateway (Nginx).

2. **VM 2: Nube Central (Core Cloud Node)**
   - **Propósito:** Simula el centro de cómputo y almacenamiento histórico en la nube.
   - **Servicios:**
     - `db-nube` (PostgreSQL 16) con almacenamiento central e histórico.
     - `app-terminales` (Servidor de aplicaciones en Node.js para admisiones y registro central).
   - **Acceso:** Solo accesible internamente por la base de datos local (para replicación) y por el Gateway.

3. **VM 3: Gateway & Seguridad (DMZ Proxy Node)**
   - **Propósito:** Actúa como proxy inverso de seguridad perimetral y servidor web estático.
   - **Servicios:**
     - `nginx-proxy` configurado para enrutar los WebSockets y servir el Frontend (`index.html`).
   - **Acceso:** Expone los puertos públicos `80` (HTTP) y `443` (HTTPS) a internet para que los clientes interactúen con la aplicación.

---

## 🔌 Uso y Ubicación de WebSockets

Los WebSockets se utilizarán para garantizar la comunicación bidireccional y en tiempo real sin recargar la página.

- **¿Para qué se usan?**
  - **Estaciones Médicas:** Para buscar fichas en tiempo real por RUT y actualizar diagnósticos de forma instantánea sin interrumpir el flujo del médico.
  - **Terminales Administrativas:** Para transmitir alertas de nuevas admisiones a todos los terminales conectados en tiempo real (monitor de admisiones).
- **¿Dónde se configuran y conectan?**
  - `/ws-medicas` (Puerto 8001): El frontend se conecta a esta ruta del Gateway. Nginx redirige internamente a la IP de la **VM 1** (`10.128.0.10:8001`).
  - `/ws-administrativas` (Puerto 8002): El frontend se conecta a esta ruta del Gateway. Nginx redirige internamente a la IP de la **VM 2** (`10.128.0.20:8002`).

---

## 👥 Plan de Trabajo por Integrantes (4 Integrantes)

Aprovechando lo desarrollado en la versión local de un solo contenedor, distribuiremos la configuración e implementación en la nube de la siguiente forma:

### 👤 Integrante 1: Estaciones Médicas (Aplicación + BD Local en VM 1)

- **Tareas:**
  1. Configurar y levantar la base de datos local `db-local` en la **VM 1** usando Docker o instalación directa.
  2. Levantar el backend `app-estaciones` en la **VM 1** configurando las variables de entorno de base de datos apuntando a localhost/IP interna de la VM 1.
  3. Asegurar que el servidor WebSocket local de `app-estaciones` escuche peticiones en el puerto `8001`.
  4. Redactar el apartado técnico del flujo de fichas clínicas locales en el informe y tomar capturas del contenedor corriendo en la VM 1.

### 👤 Integrante 2: Terminales Administrativas (Aplicación + BD Nube en VM 2)

- **Tareas:**
  1. Configurar y levantar la base de datos central `db-nube` en la **VM 2**.
  2. Levantar el backend `app-terminales` en la **VM 2** configurando las variables de entorno de base de datos apuntando a localhost/IP interna de la VM 2.
  3. Asegurar que el servidor WebSocket de `app-terminales` escuche peticiones en el puerto `8002`.
  4. Redactar el apartado de lógica de admisiones en el informe y documentar los logs de recepción de solicitudes de admisión en la VM 2.

### 👤 Integrante 3: DevOps e Infraestructura Transversal (Redes, VMs y Réplica)

- **Tareas:**
  1. Crear la red VPC en GCP y habilitar las reglas de firewall necesarias (ej. permitir tráfico en el puerto `5432` solo entre la **VM 1** y la **VM 2**, y permitir los puertos `8001`/`8002` desde la **VM 3** hacia la **VM 1** y **VM 2**).
  2. Crear y aprovisionar las 3 VMs de Compute Engine en GCP.
  3. **Configurar la Replicación Lógica Bidireccional:**
     - Modificar la conexión de la suscripción de `db-nube` en **VM 2** para que apunte a la IP privada de la **VM 1** (`host=10.128.0.10`).
     - Crear la suscripción correspondiente en `db-local` en la **VM 1** apuntando a la IP privada de la **VM 2** (`host=10.128.0.20`) para que escuche los datos ingresados en la nube.
     - Validar que los datos de origen `'local'` viajen a la nube y los de origen `'nube'` viajen al local sin generar bucles infinitos utilizando la cláusula `origin = none` de PostgreSQL 16.

### 👤 Integrante 4: Seguridad, Gateway y QA (VM 3)

- **Tareas:**
  1. Desplegar el servidor Nginx en la **VM 3**.
  2. Configurar `nginx.conf` para redirigir `/ws-medicas` a la IP privada de la **VM 1** (`http://10.128.0.10:8001`) y `/ws-administrativas` a la IP privada de la **VM 2** (`http://10.128.0.20:8002`).
  3. Alojar el código del frontend estático (`index.html`) en la **VM 3** para que se cargue al acceder a la IP pública de esta VM.
  4. Probar y QA la arquitectura completa: simular la caída de la conexión y verificar que las bases se sincronicen asíncronamente al restablecerse, y consolidar el informe final y la presentación.

---

## 🔍 Plan de Verificación

1. **Prueba de Conectividad:** Verificar que el Frontend cargue correctamente desde la IP pública de la **VM 3** y que ambos badges de conexión ("Estaciones Médicas" y "Terminales Adm.") muestren estado **Conectado**.
2. **Prueba de Admisión (Nube a Local):** Registrar un paciente en la sección de Admisión. Verificar que se cree en `db-nube` (VM 2) y se replique automáticamente a `db-local` (VM 1) en menos de 2 segundos.
3. **Prueba de Consulta y Edición (Local):** Buscar al paciente recién creado por su RUT en la sección de Estaciones Médicas, actualizar su diagnóstico, y validar que se actualice en la base local y viaje de vuelta a la nube.
