# Plan de Trabajo y Definición del Proyecto: Sistema Médico Distribuido

Este documento consolida la definición del proyecto, la distribución de componentes en Google Cloud Platform (GCP), la asignación de responsabilidades para los 4 integrantes y el checklist detallado de tareas a realizar.

---

## Definición del Proyecto

### ¿Qué es el proyecto?

Es un simulador distribuido y de alta disponibilidad para la gestión de un centro de salud. Permite interactuar con dos áreas críticas: **Estaciones Médicas (Fichas Clínicas)** y **Terminales Administrativas (Admisiones)**, conectando un entorno local emulado con un nodo central en la nube.

### ¿Para quién es la interfaz?

La interfaz es de **uso exclusivo para los trabajadores del centro de salud** (personal médico, enfermeros y administrativos).

- **Administrativos (Mesón de Ingreso/Admisión):** Utilizan la sección de **Terminales Administrativas** para ingresar a los pacientes cuando llegan físicamente al centro de salud.
- **Personal Médico/Clínico:** Utilizan la sección de **Estaciones Médicas** en sus consultorios para buscar a los pacientes por su RUT, consultar su historial clínico y actualizar sus diagnósticos y tratamientos (recetas).
- **Pacientes:** No tienen acceso a esta interfaz; son registrados e ingresados por los trabajadores.

---

## Distribución de Componentes en VMs de GCP

El sistema se distribuirá en **3 Máquinas Virtuales (VMs)** creadas en el mismo proyecto de GCP bajo una red VPC común para asegurar una topología verdaderamente distribuida:

| Componente         | Tipo                | VM de Ejecución           | IP Interna (Ejemplo) | Puerto       | Descripción                                                         |
| :----------------- | :------------------ | :------------------------ | :------------------- | :----------- | :------------------------------------------------------------------ |
| **Frontend**       | Interfaz Web        | **VM 3 (Gateway)**        | `10.128.0.30`        | `80` / `443` | Servido por Nginx al navegador del usuario final.                   |
| **Nginx Proxy**    | Gateway / Seguridad | **VM 3 (Gateway)**        | `10.128.0.30`        | `80` / `443` | Única entrada pública. Enruta los WebSockets a VM 1 y VM 2.         |
| **app-estaciones** | Backend             | **VM 1 (Hospital Local)** | `10.128.0.10`        | `8001`       | Gestiona consultas y actualizaciones de fichas mediante WebSockets. |
| **db-local**       | Base de Datos       | **VM 1 (Hospital Local)** | `10.128.0.10`        | `5432`       | PostgreSQL local con datos de alta demanda y caché local.           |
| **app-terminales** | Backend             | **VM 2 (Nube Central)**   | `10.128.0.20`        | `8002`       | Gestiona el ingreso y admisión de pacientes.                        |
| **db-nube**        | Base de Datos       | **VM 2 (Nube Central)**   | `10.128.0.20`        | `5432`       | PostgreSQL central con el historial clínico global consolidado.     |

---

## Plan de Trabajo por Integrante

### Integrante 1: Área Estaciones Médicas (Aplicación + BD Local en VM 1)

- **Componente a cargo:** `app-estaciones` y `db-local` en **VM 1 (Hospital Local)**.
- **Responsabilidades:**
  - Configurar y levantar la base de datos `db-local` con el esquema de tablas iniciales.
  - Implementar y ejecutar el servidor WebSocket backend de `estaciones-medicas` en el puerto `8001`.
  - Asegurar la conexión del backend a la base de datos local usando variables de entorno.
  - Documentar el comportamiento del flujo clínico local y capturar las evidencias de funcionamiento para el informe.

### Integrante 2: Área Terminales Administrativas (Aplicación + BD Nube en VM 2)

- **Componente a cargo:** `app-terminales` y `db-nube` en **VM 2 (Nube Central)**.
- **Responsabilidades:**
  - Configurar y levantar la base de datos `db-nube` con el esquema de tablas iniciales.
  - Implementar y ejecutar el servidor WebSocket backend de `terminales-administrativas` en el puerto `8002`.
  - Asegurar la conexión del backend a la base de datos de la nube usando variables de entorno.
  - Documentar el flujo administrativo de admisión y capturar evidencias de logs para el informe.

### Integrante 3: DevOps e Infraestructura Transversal (Redes, VMs y Réplica)

- **Componente a cargo:** Infraestructura de red, Aprovisionamiento de VMs en GCP y Replicación Lógica PostgreSQL.
- **Responsabilidades:**
  - Crear la red VPC, subredes y configurar las reglas de firewall en la consola de GCP. (IPs privadas)
  - Aprovisionar las 3 VMs de Compute Engine e instalar Docker / Docker Compose.
  - Configurar la replicación lógica bidireccional entre `db-local` (VM 1) y `db-nube` (VM 2) usando IPs privadas.
  - Configurar filtros de publicación y la cláusula `origin = none` para evitar bucles infinitos en PostgreSQL 16.

### Integrante 4: Seguridad, Gateway y QA (Nginx + Frontend en VM 3)

- **Componente a cargo:** `nginx-proxy` y Frontend (`index.html`) en **VM 3 (Gateway & Seguridad)**.
- **Responsabilidades:**
  - Configurar y levantar Nginx en la VM 3 sirviendo el Frontend.
  - Mapear y enrutar las conexiones WebSocket entrantes a `/ws-medicas` (hacia VM 1) y `/ws-administrativas` (hacia VM 2) a través de sus IPs privadas.
  - Aplicar medidas de seguridad (Rate limiting en Nginx, cabeceras HTTP de seguridad, configuración SSL/TLS).
  - Realizar pruebas de extremo a extremo y consolidar el informe final junto a la presentación del grupo.

---
