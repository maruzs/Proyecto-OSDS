# Propuesta de SLA y SLO — Sistema Clínico Distribuido
## Proyecto 3: Sistemas Distribuidos · Universidad de Talca

**Versión:** 1.0  
**Fecha:** 7 de julio de 2026  
**Equipo:** Hernandez · Muñoz · Martinez · Paredes  
**Contacto técnico:** rpavez@utalca.cl

---

## 1. Introducción

Este documento formaliza los **Acuerdos de Nivel de Servicio (SLA)** y los **Objetivos de Nivel de Servicio (SLO)** del Sistema Clínico Distribuido (OSDS-P3), desplegado en Google Cloud Platform para el centro de salud regional.

El propósito es establecer compromisos claros, medibles y verificables de disponibilidad, rendimiento y recuperación ante fallos para cada componente del sistema.

---

## 2. SLA — Service Level Agreement (Acuerdo de Nivel de Servicio)

Un SLA es un contrato formal entre el proveedor del sistema y el cliente (el centro de salud), que define el nivel mínimo de servicio aceptable. Incluye disponibilidad garantizada, tiempos de recuperación y penalizaciones por incumplimiento.

### 2.1 Disponibilidad garantizada por servicio

| Servicio | Disponibilidad mensual | Caída máx./mes | RTO | RPO |
|----------|:---:|:---:|:---:|:---:|
| **App 1 — Estaciones Médicas** | **99.5%** | 3.6 h | < 5 seg | 0 seg |
| **App 2 — Terminales Administrativas** | **99.5%** | 3.6 h | < 5 seg | 0 seg |
| **App 3 — Sistema de Bodega** | **99.0%** | 7.2 h | < 30 seg | 10 seg |
| **Middleware** | **99.9%** | 43.8 min | < 10 seg | 10 seg |
| **Base de Datos (MariaDB, PostgreSQL, MySQL)** | **99.9%** | 43.8 min | < 3 seg | 0 seg |
| **Frontend / Nginx Gateway** | **99.95%** | 21.9 min | < 1 seg | N/A |

> **RTO (Recovery Time Objective):** Tiempo máximo admisible desde que ocurre un fallo hasta que el servicio vuelve a estar disponible.  
> **RPO (Recovery Point Objective):** Cantidad máxima de datos que puede perderse en caso de fallo, expresada en tiempo.

### 2.2 Fórmula de disponibilidad

$$\text{Disponibilidad} = \frac{\text{Tiempo total del período} - \text{Tiempo de caída no planificada}}{\text{Tiempo total del período}} \times 100\%$$

### 2.3 Cómo se logra la disponibilidad garantizada

| Capa | Mecanismo | RTO alcanzado |
|------|-----------|:---:|
| Aplicación | Nginx con réplica de app en modo backup | < 5 seg |
| Base de Datos | HAProxy con health checks cada 3 seg + réplica activa | < 3 seg |
| Integración | Cola SQLite + worker de sincronización (cada 10 seg) | < 15 seg |

### 2.4 Exclusiones del SLA

No se consideran violaciones del SLA los períodos de no disponibilidad causados por:

- **Mantenimiento planificado:** notificado con ≥ 24 horas de anticipación.
- **Fuerza mayor:** cortes de electricidad, desastres naturales, fallo total del proveedor de infraestructura (GCP).
- **Ataques de denegación de servicio (DoS/DDoS)** masivos externos.
- **Errores de configuración** realizados por personal del centro de salud fuera del alcance de esta solución.
- **Agotamiento de cuota** de los servicios de GCP.

### 2.5 Penalizaciones por incumplimiento

| Disponibilidad real (mensual) | Crédito de servicio aplicado |
|-------------------------------|:---:|
| ≥ 99.5% | Sin crédito (cumplimiento normal) |
| 95.0% – 99.4% | 10% del costo mensual del servicio |
| 90.0% – 94.9% | 25% del costo mensual del servicio |
| < 90.0% | 50% del costo mensual del servicio |

### 2.6 Procedimiento de reclamación

1. El cliente detecta una interrupción del servicio y la documenta con fecha y hora.
2. Se abre un ticket de incidencia dentro de las primeras **24 horas** tras la restauración del servicio.
3. El equipo técnico valida los logs del sistema y calcula el tiempo real de indisponibilidad.
4. Si se confirma el incumplimiento, el crédito se aplica en el siguiente período de facturación.

---

## 3. SLO — Service Level Objectives (Objetivos de Nivel de Servicio)

Los SLO son metas internas de rendimiento más estrictas que el SLA, que el equipo de desarrollo se compromete a alcanzar para garantizar una experiencia óptima a los usuarios del sistema.

### 3.1 Métricas de rendimiento y latencia

| Objetivo | Métrica | Umbral objetivo | Umbral crítico |
|----------|---------|:---:|:---:|
| **Latencia WebSocket — Estaciones Médicas** | Tiempo respuesta consulta clínica (p95) | < 300 ms | < 500 ms |
| **Latencia WebSocket — Terminales Admin.** | Tiempo respuesta admisión paciente (p95) | < 300 ms | < 500 ms |
| **Latencia Middleware** | POST `/api/mw/diagnosticos` (p99) | < 150 ms | < 200 ms |
| **Latencia App Bodega** | POST `/api/inventario/descontar` (p99) | < 100 ms | < 150 ms |

### 3.2 Métricas de resiliencia

| Objetivo | Métrica | Umbral |
|----------|---------|:---:|
| **Failover de aplicación** | Tiempo de redireccionamiento Nginx | < 5 segundos |
| **Failover de base de datos** | Tiempo de conmutación HAProxy | < 3 segundos |
| **Sincronización de contingencia** | Tiempo máx. vaciado de cola SQLite | < 15 segundos |
| **Reconexión automática de la aplicación** | Tiempo hasta WebSocket restablecido | < 10 segundos |

### 3.3 Métricas de integridad y calidad

| Objetivo | Métrica | Umbral |
|----------|---------|:---:|
| **Integridad de registros clínicos** | Pérdida de datos en failover | 0% (cero pérdida) |
| **Tasa de error HTTP** | Porcentaje de respuestas 5xx | < 0.1% |
| **Capacidad concurrente** | Sesiones WebSocket simultáneas por servicio | ≥ 50 |
| **Consistencia de réplica** | Retraso máximo entre maestro y réplica | < 1 segundo |

### 3.4 Indicadores de error (SLI — Service Level Indicators)

Para medir el cumplimiento de los SLO, se definen los siguientes indicadores:

```
SLI_latencia     = P95(tiempo_respuesta_websocket) < umbral_objetivo
SLI_disponib     = (solicitudes_exitosas / total_solicitudes) > 0.995
SLI_integridad   = (registros_en_replica / registros_en_maestro) == 1.0
SLI_failover     = tiempo_deteccion_fallo < 3s AND tiempo_conmutacion < 5s
```

### 3.5 Mecanismos de medición

| Indicador | Herramienta de medición |
|-----------|------------------------|
| Latencia de WebSocket | Timestamp en cliente (F12 → Network) al enviar y al recibir confirmación |
| Disponibilidad | Logs de Nginx + tiempo entre health checks fallidos y exitosos |
| Failover de BD | Logs de HAProxy (`server DOWN` → `server UP`) |
| Integridad de datos | Conteo de registros en maestro vs. réplica tras failover |
| Cola de contingencia | Conteo de filas en `cola_contingencia` antes y después de sincronización |

### 3.6 Alertas automáticas definidas

| Condición | Acción automática |
|-----------|-------------------|
| App principal sin responder (1 reintento) | Nginx redirige a réplica de aplicación |
| BD primaria sin responder (health check fallido) | HAProxy activa réplica de base de datos |
| Middleware falla al escribir en MySQL | Encola operación en SQLite (PENDING) |
| Worker detecta cola no vacía | Reintenta sincronización cada 10 segundos |
| Contenedor cae (crash) | Docker `restart: always` reinicia automáticamente |

---

## 4. Matriz de Responsabilidades

| Componente | Responsable técnico | Contacto |
|------------|--------------------:|---------|
| Infraestructura GCP, Nginx, Cloudflare | Krisstal Hernandez | Integrante 1 |
| App 1 (Estaciones Médicas) + MariaDB | Mariano Muñoz | Integrante 2 |
| App 2 (Terminales Admin.) + PostgreSQL | Felipe Martinez | Integrante 3 |
| Middleware + App 3 (Bodega) + MySQL + SLA/SLO | Maximiliano Paredes | Integrante 4 |

---

## 5. Historial de revisiones

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 0.1 | 30-06-2026 | Borrador inicial (Entrega 1) |
| 1.0 | 07-07-2026 | Versión final con métricas validadas por pruebas (Entrega 2) |
