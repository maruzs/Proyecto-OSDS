# Guía de Defensa OSDS - VM3 (Gateway, Middleware y BD Central)

Este documento ha sido diseñado para prepararte en la explicación, presentación y defensa técnica de la **VM3** ante la comisión evaluadora. Contiene los conceptos clave, justificaciones de diseño, diagramas de flujo interno y respuestas a preguntas difíciles de la comisión.

---

## 1. Resumen Ejecutivo de la VM3: ¿Qué rol cumple?
La VM3 es el **cerebro de integración y seguridad** del sistema. No es solo un gateway; consolida tres grandes pilares:
1.  **Capa Ingress y de Seguridad (SecOps):** Cloudflare Tunnel + Nginx Proxy Inverso.
2.  **Capa de Integración y Tolerancia (Middleware):** Node.js API + Búfer de contingencia local SQLite.
3.  **Capa de Negocio e Inventario (Aplicación 3):** Sistema de Bodega + BD Central MySQL (Maestro-Réplica + HAProxy).

---

## 2. Los Componentes de la VM3 (Explicados al Detalle)

### 🛡️ Componente A: Cloudflare Tunnel (`cloudflare-tunnel`)
*   **¿Qué es?** Es un conector de salida seguro (`cloudflared`) que establece una conexión encriptada de origen hacia la red de Cloudflare Edge.
*   **Defensa / Justificación Técnica:** 
    *   **Cero puertos expuestos:** No tuvimos que abrir puertos entrantes (Ingress) en el Firewall de GCP para el tráfico web (los puertos 80 y 443 externos están deshabilitados). La VM inicia la conexión hacia afuera (Egress), eliminando por completo la superficie de ataques por escaneo de IPs.
    *   **Seguridad perimetral:** Cloudflare absorbe los ataques DDoS de capa 3 y 4, mitiga bots y aplica SSL/TLS de forma automática en sus servidores antes de que el tráfico toque nuestra VM3.

### 🔀 Componente B: Nginx Proxy Inverso (`nginx-proxy`)
*   **¿Qué es?** Es el despachador de tráfico interno de la VM3.
*   **Defensa / Justificación Técnica:**
    *   **Balanceo y Failover de Aplicación:** Implementa bloques `upstream` que rutean el tráfico WebSockets hacia las VMs correspondientes. Si la app principal de la VM1 o VM2 se detiene, Nginx conmuta inmediatamente hacia las réplicas locales (`app-estaciones-replica` / `app-terminales-replica`) usando la directiva `backup`.
    *   **Headers de Seguridad:** Inyecta cabeceras HTTP restrictivas:
        *   `X-Frame-Options: SAMEORIGIN` (previene clickjacking).
        *   `X-Content-Type-Options: nosniff` (previene inyección MIME).
        *   `Content-Security-Policy (CSP)` (restringe la ejecución de scripts no autorizados).
    *   **Rate Limiting:** Limita las conexiones WebSocket concurrentes (`limit_req_zone`) para prevenir inundación de handshakes (DDoS en capa de aplicación).

### ⚙️ Componente C: El Middleware (`app-middleware`)
*   **¿Qué es?** Un bus de servicios en Node.js/Express que expone endpoints REST (`/api/mw/pacientes` y `/api/mw/diagnosticos`) a través de la red privada interna (VPC) para recibir actualizaciones de la VM1 y VM2.
*   **Defensa / Justificación Técnica:**
    *   **Heterogeneidad:** Como la VM1 (MariaDB) y la VM2 (Postgres) usan motores distintos, no podíamos replicar datos directamente entre ellas. El Middleware actúa como integrador traduciendo y consolidando los datos en la base central MySQL.
    *   **Búfer SQLite (`contingencia.db`):** Si la base central MySQL o la App de Bodega se caen, el Middleware almacena el payload en una cola local SQLite en la VM3 y responde al cliente de inmediato en modo diferido (`PENDING`).
    *   **Worker Sincronizador:** Ejecuta un proceso en segundo plano cada 10 segundos que intenta reconectar y procesar las peticiones encoladas en orden cronológico (FIFO).

### 📦 Componente D: Aplicación 3 (Sistema de Bodega - `app-bodega`)
*   **¿Qué es?** El tercer módulo clínico requerido en la entrega. Controla el inventario de medicamentos e insumos médicos (sueros, jeringas, etc.).
*   **Defensa / Justificación Técnica:**
    *   Expone la API `/api/inventario/descontar` para reducir el stock físico cuando el médico registra un diagnóstico que incluye recetas (ej: *"Paracetamol"*).

### 🗄️ Componente E: Base de Datos Central (MySQL Maestro-Réplica + HAProxy)
*   **¿Qué es?** Dos contenedores de MySQL 8.0 (`db-central-master` y `db-central-replica`) balanceados por HAProxy (`db-central-proxy`).
*   **Defensa / Justificación Técnica:**
    *   Asegura alta disponibilidad para los registros consolidados. Si el master de MySQL cae, HAProxy desvía las consultas a la réplica en caliente de forma transparente.

---

## 3. Respuestas Rápidas para la Defensa (Q&A)

### 💬 Pregunta: ¿Por qué usaron un túnel de Cloudflare en vez de IP pública y SSH clásico?
*   **Respuesta:** Por seguridad (SecOps). Las mejores prácticas de Cloud dictan que las instancias internas de producción no deben exponerse directamente a internet. El túnel nos permite servir la aplicación al exterior a través de HTTPS cifrado y con protección perimetral contra DDoS sin abrir un solo puerto de entrada (Ingress) en GCP.

### 💬 Pregunta: ¿Cómo funciona la tolerancia a fallos si se cae la base de datos central en la VM3?
*   **Respuesta:** A dos niveles. Primero, HAProxy detecta la caída y desvía la consulta a la réplica de MySQL local. Segundo, si ambas bases estuvieran apagadas por mantenimiento, el Middleware intercepta el error y retiene los registros en una base de datos local SQLite de contingencia (`contingencia.db`) mediante un worker de sincronización en segundo plano. Los médicos y administrativos pueden seguir operando sin pérdida de datos.

### 💬 Pregunta: ¿Cómo se comunica la VM1 y la VM2 con la VM3?
*   **Respuesta:** A través de la red privada interna (VPC) de GCP utilizando direccionamiento IP interno. La VM1 (estaciones) le envía HTTP POST a `http://10.128.0.30:8000/api/mw/diagnosticos` y la VM2 (admisiones) a `/api/mw/pacientes`. Al ir por la red interna, no hay consumo de ancho de banda público ni exposición a internet, lo que reduce la latencia y aumenta la seguridad.

### 💬 Pregunta: ¿Por qué la VM3 necesita ser de tipo `e2-medium` y no `e2-micro`?
*   **Respuesta:** La VM3 corre 7 contenedores en total, incluyendo dos motores de base de datos MySQL 8.0 completos, Node.js, Nginx y Cloudflared. Esto requiere al menos 2 GB de RAM. Una máquina `e2-micro` (1 GB) sufriría de congelamiento de sistema por agotamiento de memoria (OOM). Por estabilidad y SLO del sistema, la escalamos a `e2-medium` (4 GB RAM).
