# Informe Técnico de Seguridad y QA (SecOps)
**Proyecto Unidad 2 - Sistemas Operativos y Distribuidos**
**Integrante 4: Seguridad y QA (SecOps)**

---

## 1. Introducción y Enfoque de SecOps

En el desarrollo de sistemas distribuidos aplicados al sector salud, la integridad, confidencialidad y disponibilidad de la información de los pacientes es un requisito crítico. El rol de **SecOps / QA** en este proyecto consiste en establecer una frontera defensiva perimetral, garantizar el aislamiento lógico de los entornos de red, mitigar riesgos comunes en conexiones persistentes (WebSockets) y asegurar que el intercambio de datos mediante replicación lógica sea estable y libre de ciclos o bucles de datos recursivos.

---

## 2. Elemento de Seguridad Perimetral: Hardening de Nginx

Nginx actúa como el **Gateway Perimetral** (Proxy Inverso) de la arquitectura. Su propósito es interceptar todas las conexiones externas e internas y enrutarlas de forma controlada hacia los contenedores de backend.

Para blindar este proxy perimetral frente a vulnerabilidades y abusos de recursos, se han implementado las siguientes directivas en la configuración de Nginx:

### A. Ocultamiento de Metadatos del Sistema (`server_tokens off;`)
Por defecto, Nginx expone su versión exacta en la cabecera de respuesta HTTP `Server` (ej. `Server: nginx/1.25.1`). Esto facilita a potenciales atacantes identificar vulnerabilidades conocidas (CVEs) asociadas a esa versión.
- **Implementación**: Se desactivó globalmente con la directiva `server_tokens off;`.

### B. Control de Carga Útil (`client_max_body_size 1m;`)
Para mitigar ataques de denegación de servicio (DoS) por agotamiento de almacenamiento o memoria mediante el envío de solicitudes de gran tamaño, se restringe el tamaño de cuerpo permitido.
- **Implementación**: Límite estricto de **1MB** (`client_max_body_size 1m;`), ideal para el tráfico del simulador.

### C. Control de Tasa de Peticiones (Rate Limiting)
Los endpoints WebSocket (`/ws-medicas` y `/ws-administrativas`) sostienen conexiones de larga duración, pero la conexión inicial es HTTP (Upgrade). Para evitar inundaciones de peticiones de apertura de conexión desde un mismo host:
- **Implementación**:
  - Definición de zona en memoria: `limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=10r/s;` (asigna 10MB para almacenar IPs de clientes y limita a 10 solicitudes por segundo).
  - Aplicación en rutas críticas: `limit_req zone=ws_limit burst=15 nodelay;` (permite un pico/ráfaga temporal de hasta 15 conexiones antes de empezar a rechazar con código HTTP 503).

### D. Inyección de Cabeceras de Seguridad HTTP
Se implementan cabeceras estándar para robustecer al navegador cliente frente a ataques habituales en frontend:
- **`X-Frame-Options "SAMEORIGIN"`**: Protege contra ataques de *Clickjacking*, evitando que el simulador sea incrustado en iframes de sitios de terceros.
- **`X-Content-Type-Options "nosniff"`**: Evita que los navegadores interpreten archivos como tipos MIME distintos a los declarados, previniendo la ejecución involuntaria de scripts maliciosos.
- **`X-XSS-Protection "1; mode=block"`**: Fuerza la activación del filtro XSS nativo del navegador, bloqueando la renderización si se detecta un ataque XSS reflejado.
- **`Content-Security-Policy (CSP)`**: Define una política de origen estricta limitando los recursos externos y scripts únicamente a sí mismo, a Google Fonts y al CDN de Socket.io:
  ```nginx
  add_header Content-Security-Policy "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.socket.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.socket.io;" always;
  ```

---

## 3. Aislamiento Lógico de Redes

La infraestructura del proyecto está segmentada en redes virtuales cerradas de Docker para simular zonas físicas e institucionales aisladas:

1. **`hospital_net`**: Dedicada en exclusiva a la base de datos local y a la aplicación de Estaciones Médicas. Ningún servicio externo (salvo el proxy) puede ver o interactuar con este segmento.
2. **`cloud_net`**: Simula la red virtual de nube donde corre la base de datos central y el terminal de admisiones.
3. **`dmz_net` (Zona Desmilitarizada)**: Red expuesta al exterior que conecta a `nginx-proxy` con los servicios. Además, sirve como túnel dedicado para el tráfico interno de replicación entre las dos bases de datos, evitando exponer los puertos de bases de datos al host directamente.

---

## 4. Replicación Segura y Prevención de Bucles Infinitos

En una base de datos distribuida con replicación lógica bidireccional, existe el riesgo de que un cambio replicado en el Nodo B se vuelva a replicar de regreso al Nodo A, generando un ciclo infinito de procesamiento y agotando los recursos del sistema.

Para garantizar la integridad y evitar estos bucles, se implementó una estrategia multinivel:

1. **Filtrado Lógico en Publicaciones (`WHERE`)**:
   - `db-local` publica únicamente las filas donde `origen_registro = 'local'`.
   - `db-nube` publica únicamente las filas donde `origen_registro = 'nube'`.
   - Como la base de datos receptora importa los datos sin modificar el valor de la columna `origen_registro`, esta fila importada no cumple la regla del filtro de la publicación local inversa y no se vuelve a retransmitir.
2. **Suscripciones con Cláusula de Origen Neutro (`origin = none`)**:
   - En PostgreSQL 16 se configuró la suscripción con `origin = none`. Esto le instruye a la base de datos que solo replique cambios generados originalmente en el publicador remoto, ignorando cambios que dicho publicador haya importado previamente de otros nodos.

---

## 5. QA: Plan de Pruebas de Integración y Flujo Completo

Para validar la correcta implementación del proyecto de extremo a extremo, se ha diseñado la siguiente suite de validación en la interfaz unificada:

1. **Prueba de Conexión en Tiempo Real**:
   - Acceder al frontend y corroborar que los badges en la cabecera marquen "Conectado" en color verde para ambos servicios WebSocket.
2. **Prueba de Admisión en la Nube (Flujo Administrativo)**:
   - Registrar un paciente usando el panel de Terminales Administrativas.
   - Validar que el evento sea capturado y desplegado al instante en el feed de actualizaciones en tiempo real del frontend.
3. **Prueba de Replicación Asíncrona Nube-Local**:
   - Ingresar a la base de datos local y comprobar que el paciente creado en la nube se ha sincronizado de forma automática.
4. **Prueba de Estación Médica (Flujo Clínico Local)**:
   - Consultar el RUT del paciente recién sincronizado en el buscador local.
   - Modificar su diagnóstico en la interfaz y confirmar el cambio.
5. **Prueba de Replicación Asíncrona Local-Nube**:
   - Confirmar en la base de datos de la nube que el cambio de diagnóstico se ha reflejado mediante la replicación de regreso sin entrar en bucle.
