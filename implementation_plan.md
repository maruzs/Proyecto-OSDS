# Plan de Implementación - Proyecto 3: Sistemas Distribuidos

Este plan detalla los pasos para evolucionar la arquitectura híbrida del Proyecto 2 a la nueva arquitectura distribuida y tolerante a fallos requerida para el **Proyecto 3**.

---

## Contexto y Mapeo de Componentes

Basado en el `informe.tex` del proyecto anterior y la `definicionProyecto.md` del nuevo enunciado:

1. **Aplicación 1 (Estaciones Médicas - Personal Clínico):**
   - **Tecnología:** Node.js (Socket.io) o similar.
   - **Base de Datos 1:** MariaDB + Réplica de Datos + Orquestador (ej. ProxySQL / MaxScale).
   - **Tolerancia a Fallos:** Réplica de la aplicación configurada detrás de un balanceador.

2. **Aplicación 2 (Terminales Administrativas - Admisión/Remuneraciones):**
   - **Tecnología:** Desarrollada en otro lenguaje (ej. Python con FastAPI) para cumplir el requerimiento de heterogeneidad.
   - **Base de Datos 2:** PostgreSQL + Réplica de Datos + Orquestador (ej. Patroni + HAProxy o Pgpool-II).
   - **Tolerancia a Fallos:** Réplica de la aplicación configurada detrás de un balanceador.

3. **Aplicación 3 (Sistema Central de Fichas/Bodega - Core):**
   - **Tecnología:** Node.js/Go/Python.
   - **Base de Datos 3:** MySQL u otro motor + Réplica de Datos.
   - **Comunicación:** Se comunica directamente con el Middleware para sincronizar la información centralizada.

4. **Middleware (API Gateway & Data Broker):**
   - **Tecnología:** Nginx como API Gateway o un servicio dedicado (ej. Express/FastAPI Gateway o un broker de mensajería como RabbitMQ si se desea asincronía).
   - **Rol:** Comunicar App 1 y App 2 con App 3, transformando los datos según sea necesario.

---

## Preguntas Abiertas e Hitos Críticos

> [!IMPORTANT]
> **Definición del Módulo Adicional:**
> Proponemos incorporar el **Sistema de Bodega e Inventario** o **Llamado de Pacientes por Ticket** como la Aplicación 3 para interactuar con las admisiones y atenciones médicas. ¿Están de acuerdo con esta asignación?

> [!WARNING]
> **Estrategia de Orquestación de Base de Datos:**
> Para simular los orquestadores de bases de datos de forma contenida en Docker, se propone usar:
> - **MariaDB:** Replicación primaria-secundaria clásica monitoreada por un contenedor de **HAProxy** o **ProxySQL** que realice failover automático.
> - **PostgreSQL:** Setup con **Pgpool-II** o **HAProxy + Keepalived** para el enrutamiento automático de consultas de escritura/lectura y failover.
> ¿Tienen alguna preferencia tecnológica específica impuesta por la cátedra para los orquestadores?

---

## Propuesta de SLA (Service Level Agreement) y SLO (Service Level Objectives)

Como parte de la entrega, se propone definir los siguientes acuerdos y objetivos de nivel de servicio:

### SLA (Acuerdo de Nivel de Servicio)
- **Disponibilidad del Servicio de Fichas Médicas (App 1):** 99.9% de disponibilidad mensual durante el horario hábil (08:00 - 20:00).
- **Tiempo de Resolución en caso de Fallo Crítico:** Menor a 15 minutos para restaurar el servicio principal mediante failover.

### SLO (Objetivos de Nivel de Servicio)
- **Latencia de Respuesta en Consultas Clínicas:** 95% de las solicitudes de consulta de fichas deben responder en menos de 100ms (gracias a la caché local).
- **RPO (Recovery Point Objective):** Pérdida máxima de datos de 5 segundos en caso de caída del nodo central (gracias a la replicación asíncrona de base de datos).
- **RTO (Recovery Time Objective):** Failover automático de base de datos en menos de 30 segundos.

---

## Cambios Propuestos por Componente

### 1. Reestructuración de VMs en GCP
- **VM 1 (Hospital Local):** Alojará **App 1 (Principal y Réplica)** + **MariaDB (Master y Replica)** + **Orquestador MariaDB**.
- **VM 2 (Nube Central):** Alojará **App 2 (Principal y Réplica)** + **PostgreSQL (Master y Replica)** + **Orquestador PostgreSQL**.
- **VM 3 (Gateway / Middleware / App 3):** Alojará el **Nginx Gateway (Proxy)** + **Middleware** + **App 3** + **DB 3 (Master y Replica)**.

### 2. Implementación de Réplicas y Balanceadores
- Configurar Nginx en cada VM para balancear la carga entre la instancia principal de la app y su réplica (ej. `app1-primary` y `app1-replica`).
- Habilitar logs detallados de fallos y redirección (HTTP 502/503 fallback).

### 3. Implementación del Middleware
- Crear un servicio API REST / WebSocket que escuche las peticiones de App 1 y App 2, aplique esquemas de validación/transformación de datos (ej. mapear RUTs o formatos de fecha) y los envíe a App 3.

---

## Plan de Verificación y Pruebas

### Escenario 1: Caída de Servidor Principal de Aplicación
- **Prueba:** Detener el contenedor de `app1-primary`.
- **Verificación:** Nginx debe redirigir el tráfico a `app1-replica` de forma transparente. Comprobar logs de Nginx y de la réplica.

### Escenario 2: Caída de Base de Datos Principal
- **Prueba:** Detener la base de datos principal (`db-postgres-primary`).
- **Verificación:** El orquestador/proxy (ej. Pgpool/HAProxy) debe detectar la caída y promover la réplica a primaria o desviar las escrituras/lecturas a la base de datos de respaldo.

### Escenario 3: Caída del Middleware
- **Prueba:** Detener el contenedor del Middleware.
- **Verificación:** App 1 y App 2 deben registrar el fallo de conexión con el Middleware en sus logs locales y degradar su funcionamiento elegantemente (ej. guardar cambios pendientes en una cola local o caché para reintentar después).
