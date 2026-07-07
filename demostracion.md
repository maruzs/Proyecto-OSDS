# Guía de Demostración de Tolerancia a Fallos - Proyecto OSDS

Este documento contiene el procedimiento paso a paso para demostrar los diferentes escenarios de tolerancia a fallos del sistema clínico distribuido ante la comisión evaluadora.

---

## 💻 ESCENARIO 1: Caída del Servidor de Aplicación Principal (VM1 / VM2)
**Objetivo:** Demostrar que el Proxy Inverso (Nginx en VM3) redirige de forma transparente las conexiones del usuario a la réplica de la aplicación si el contenedor principal falla.

### Paso 1: Estado inicial
*   **Qué hacer y dónde:** Abre tu navegador web en `https://osds.epistia.cl`, inicia sesión y abre las herramientas de desarrollo (`F12`), pestaña **Red (Network)** -> **WS**.
*   **Resultado esperado:** Se observa la conexión activa del WebSocket (`/ws-medicas` y `/ws-administrativas`).

### Paso 2: Detener la aplicación principal (VM2)
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, ejecuta:
    ```bash
    gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker stop app-terminales"
    ```
*   **Resultado esperado:** El contenedor principal se detiene. La réplica `app-terminales-replica` sigue activa.

### Paso 3: Interactuar en la Interfaz Web
*   **Qué hacer y dónde:** En la web, ve al módulo de Admisión y registra un nuevo paciente (ej: RUT `11.111.111-1`, Nombre `Paciente Failover App`). Presiona **Admitir**.
*   **Resultado esperado:** La ficha se registra de inmediato y la web no se cae. En el panel de red del navegador, se ve que Nginx desvió el handshake de WebSocket al puerto `8012` (réplica de VM2) de forma transparente.

### Paso 4: Levantar y restaurar el servicio principal
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, ejecuta:
    ```bash
    gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker start app-terminales"
    ```
*   **Resultado esperado:** La app principal vuelve a estar operativa. Nginx reanuda el balanceo de carga entre ambas instancias.

---

## 🗄️ ESCENARIO 2: Caída de la Base de Datos Principal Local/Nube (VM1 / VM2)
**Objetivo:** Demostrar que la aplicación no se cae si el PostgreSQL Maestro falla, ya que HAProxy desvía el tráfico hacia la base de datos de respaldo (Réplica).

### Paso 1: Detener la Base de Datos Maestra de la Nube (VM2)
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, ejecuta:
    ```bash
    gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker stop db-nube-master"
    ```
*   **Resultado esperado:** El servidor PostgreSQL maestro de la nube se apaga.

### Paso 2: Consultar la información en la Web
*   **Qué hacer y dónde:** En la interfaz web (con rol Médico), ingresa un RUT de paciente ya registrado y presiona buscar.
*   **Resultado esperado:** Los datos clínicos se cargan perfectamente. HAProxy en la VM2 (`db-nube-proxy`) detectó la caída del maestro y redirigió la consulta de lectura directamente a la réplica física (`db-nube-replica`).

### Paso 3: Levantar y restaurar la Base de Datos Maestra
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, ejecuta:
    ```bash
    gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker start db-nube-master"
    ```
*   **Resultado esperado:** El PostgreSQL maestro vuelve a estar activo y HAProxy retoma las escrituras y lecturas de manera normal.

---

## 🔄 ESCENARIO 3: Caída Total de la Base de Datos Central (VM3)
**Objetivo:** Probar el búfer de contingencia en caliente. Si las bases de datos de la VM3 fallan, el Middleware almacena las transacciones localmente en la base de contingencia PostgreSQL (`db-contingencia`) y las sincroniza en segundo plano cuando la base central revive.

### Paso 1: Simular caída total de la Base de Datos Central MySQL
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, apaga las bases Maestro y Réplica en la VM3:
    ```bash
    gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker stop db-central-master db-central-replica"
    ```
*   **Resultado esperado:** Ambos servidores centrales de base de datos se detienen.

### Paso 2: Registrar un Paciente en la Interfaz Web
*   **Qué hacer y dónde:** En la web, registra un nuevo paciente (ej: RUT `22.222.222-2`, Nombre `Paciente Contingencia`). Presiona **Admitir**.
*   **Resultado esperado:** La web responde exitosamente al usuario ("Paciente Procesado"). Como la base de datos central estaba apagada, el Middleware interceptó el fallo de conexión y encoló la transacción.

### Paso 3: Verificar que el registro está en la cola de contingencia
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, realiza una consulta SQL a la base de contingencia local de la VM3:
    ```bash
    gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec -i db-contingencia psql -U postgres -d contingencia -c 'SELECT * FROM cola_contingencia;'"
    ```
*   **Resultado esperado:** En la consola se muestra el registro del paciente encolado con estado `ADMITIR_PACIENTE` listo para procesar.

### Paso 4: Levantar y restaurar las bases de datos centrales
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, enciende los contenedores de MySQL Central de nuevo:
    ```bash
    gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker start db-central-master db-central-replica"
    ```
*   **Resultado esperado:** Las bases centrales se levantan.

### Paso 5: Verificar la sincronización automática (Worker)
*   **Qué hacer y dónde:** Espera 10 segundos (tiempo en el que corre el worker en segundo plano del Middleware) y vuelve a consultar la cola de contingencia:
    ```bash
    gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec -i db-contingencia psql -U postgres -d contingencia -c 'SELECT * FROM cola_contingencia;'"
    ```
*   **Resultado esperado:** La respuesta muestra `(0 rows)` o tabla vacía, demostrando que el Middleware detectó la restauración del servicio central, procesó la transacción encolada y limpió el búfer.

### Paso 6: Verificar el dato en la base de datos central MySQL
*   **Qué hacer y dónde:** En **GCP Cloud Shell**, consulta si el registro ya ingresó a la base consolidadora final:
    ```bash
    gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec -i db-central-master psql -U postgres -d clinica_central -c 'SELECT * FROM registro_admisiones WHERE rut = \'22.222.222-2\';'"
    ```
*   **Resultado esperado:** Se muestra la fila consolidada exitosamente en la base de datos central de MySQL.
