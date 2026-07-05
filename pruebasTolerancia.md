# Guía Detallada de Pruebas de Tolerancia a Fallos - Proyecto 3 OSDS

Esta guía contiene los procedimientos paso a paso para simular, probar y documentar las tres pruebas de tolerancia a fallos requeridas en la entrega.

---

## 🛠️ PRUEBA 1: Caída del Servidor de Aplicación Principal
**Objetivo:** Demostrar que el Gateway (Nginx) detecta la caída de un servidor de aplicación principal (VM1 o VM2) y redirige automáticamente todo el tráfico hacia su correspondiente réplica de aplicación sin interrumpir el servicio al usuario.

### Paso a Paso del Procedimiento:
1. **Verificar estado inicial:**
   * Entra a la web `https://osds.epistia.cl` (o tu dominio asignado).
   * Abre las herramientas de desarrollo del navegador (`F12`), ve a la pestaña **Network** (Red) y filtra por **WS** (WebSockets).
   * Verifica que las conexiones `/ws-medicas` y `/ws-administrativas` estén establecidas.

2. **Simular la caída de la Aplicación Principal de Admisión en VM2:**
   * En **GCP Cloud Shell**, apaga el contenedor principal `app-terminales`:
     ```bash
     gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker stop app-terminales"
     ```
   * *Nota: La réplica `app-terminales-replica` seguirá en ejecución.*

3. **Verificar el failover en caliente:**
   * Vuelve a la pestaña de la interfaz web.
   * Sin recargar la página, intenta registrar un nuevo paciente (ej: RUT `11111111-1`, Nombre `Paciente Failover App`).
   * **Resultado Esperado:** La interfaz registrará al paciente con éxito, y la conexión WebSocket se restablecerá casi instantáneamente a través de Nginx hacia el contenedor réplica de la VM2.

4. **Restablecer el servicio:**
   * Vuelve a encender la aplicación principal:
     ```bash
     gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker start app-terminales"
     ```

### 📸 Qué Documentar en el Informe:
*   **Captura de Pantalla 1:** El panel de red del navegador (`F12`) mostrando que la petición de admisión fue exitosa a pesar del corte.
*   **Logs de Nginx (VM3):** Ejecuta este comando en Cloud Shell y copia el output que muestre el desvío del tráfico a la réplica:
    ```bash
    gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker logs nginx-proxy --tail 20"
    ```
*   **Estado de Contenedores:** Captura el output de `docker ps` en la VM2 mostrando la app principal detenida y la réplica corriendo.

---

## 💾 PRUEBA 2: Interrupción de la Base de Datos Principal
**Objetivo:** Demostrar que al apagarse el motor de base de datos principal (Maestro), el proxy local (HAProxy) detecta la caída y redirige las consultas a la base de datos Réplica de manera instantánea y transparente para la aplicación.

### Paso a Paso del Procedimiento:
1. **Simular la caída del Maestro de MariaDB en VM1:**
   * En **GCP Cloud Shell**, apaga el contenedor de la base de datos principal:
     ```bash
     gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker stop db-local-master"
     ```

2. **Realizar pruebas en la interfaz web:**
   * En la web (con rol Médico), busca un paciente por RUT que ya estuviera pre-cargado (ej: `12345678-9`).
   * **Resultado Esperado:** La aplicación responderá normalmente cargando los datos de la ficha clínica del paciente directamente desde `db-local-replica` enrutado por `db-local-proxy`.

3. **Restablecer la base de datos:**
   * Vuelve a encender el maestro:
     ```bash
     gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker start db-local-master"
     ```

### 📸 Qué Documentar en el Informe:
*   **Captura de Pantalla 2:** La interfaz web cargando correctamente los datos clínicos de un paciente mientras la base principal está caída.
*   **Logs de HAProxy (VM1):** Copia los logs que evidencien que detectó la caída del servidor `db-master` y marcó como activo el servidor `db-replica`:
    ```bash
    gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker logs db-local-proxy --tail 20"
    ```

---

## 🔀 PRUEBA 3: Caída del Middleware y Recuperación Asíncrona (Cola Contingencia)
**Objetivo:** Probar que si el Middleware no puede comunicarse con la Aplicación de Bodega (o con la base MySQL central), almacena de forma segura la transacción localmente en una base de datos SQLite de contingencia y la sincroniza de forma retroactiva cuando el servicio vuelve a estar en línea.

### Paso a Paso del Procedimiento:
1. **Simular caída del servicio de Bodega (App 3):**
   * En **GCP Cloud Shell**, apaga el contenedor de la Aplicación de Bodega en la VM3:
     ```bash
     gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker stop app-bodega"
     ```

2. **Ejecutar la transacción en la Interfaz Web:**
   * Con el rol Médico, ingresa a la ficha de un paciente.
   * Modifica el diagnóstico agregando la receta de un medicamento controlado por inventario, por ejemplo: `"Paciente requiere tratamiento con Paracetamol 500mg"`.
   * Presiona "Actualizar Diagnóstico".
   * **Resultado Esperado en la Web:** El diagnóstico se guardará localmente en la VM1 sin errores, pero el Middleware retornará un estado `PENDING` internamente al no poder enviar la transacción a Bodega.

3. **Verificar la cola de contingencia en el Middleware:**
   * Conéctate a la VM3 y realiza una consulta a la base de datos SQLite local para comprobar que el descuento quedó guardado en la cola:
     ```bash
     gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec -i app-middleware sqlite3 /app/contingencia.db 'SELECT * FROM cola_contingencia;'"
     ```
   * **Resultado Esperado:** Verás una fila con el tipo `DESCONTAR_BODEGA` y el JSON del insumo encolado.

4. **Restablecer el servicio de Bodega:**
   * Enciende el contenedor de Bodega de nuevo:
     ```bash
     gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker start app-bodega"
     ```

5. **Verificar la sincronización automática:**
   * Espera 10 segundos (que es el intervalo del worker sincronizador).
   * Vuelve a consultar la tabla de contingencia del Middleware:
     ```bash
     gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec -i app-middleware sqlite3 /app/contingencia.db 'SELECT * FROM cola_contingencia;'"
     ```
   * **Resultado Esperado:** La tabla estará vacía porque el worker procesó el descuento y limpió la cola.
   * Consulta el stock del insumo en la base central MySQL para ver si se descontó:
     ```bash
     gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec -i db-central-master mysql -u root -proot_secure_pass -e 'SELECT * FROM clinica_central.inventario_insumos;'"
     ```
   * **Resultado Esperado:** El stock de `Paracetamol 500mg` (INS-001) habrá bajado de 500 a 499 unidades.

### 📸 Qué Documentar en el Informe:
*   **Texto de Consola (SQL):** Copiar la consulta SQL de `cola_contingencia` con el registro pendiente.
*   **Logs del Middleware (VM3):** Copiar las líneas de log que digan:
    *   `[MIDDLEWARE_ERROR] Error al notificar a bodega ... Encolando consumo.`
    *   `[SINCRONIZADOR] Sincronizando elemento ID ... de tipo DESCONTAR_BODEGA`
    *   `[SINCRONIZADOR] Elemento ID ... sincronizado y eliminado de la cola.`
    Obtén estos logs usando:
    ```bash
    gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker logs app-middleware --tail 30"
    ```
*   **Texto de Consola (MySQL):** Copiar la tabla del inventario final demostrando el descuento del stock.
