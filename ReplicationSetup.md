# Guía de Configuración: Replicación Lógica Bidireccional (PostgreSQL 16)

Esta guía detalla los pasos que debe seguir el **Integrante 3 (DevOps)** para configurar la replicación lógica bidireccional entre la base de datos local (**VM 1**) y la base de datos de la nube (**VM 2**), utilizando IPs privadas en GCP y evitando bucles infinitos con la cláusula `origin = none`.

---

## 🛠️ Resumen de la Topología de Red y Componentes

* **VM 1: Hospital Local (`vm-hospital-local`)**
  * **IP Privada**: `10.128.0.10`
  * **Base de Datos**: Contenedor `db-local` (PostgreSQL 16 en puerto `5432`).
  * **Publicación**: `pub_local_a_nube` (Filtra filas con `origen_registro = 'local'`).
  * **Suscripción**: `sub_desde_nube` (Apunta a `10.128.0.20`, con `origin = none`).

* **VM 2: Nube Central (`vm-nube-central`)**
  * **IP Privada**: `10.128.0.20`
  * **Base de Datos**: Contenedor `db-nube` (PostgreSQL 16 en puerto `5432`).
  * **Publicación**: `pub_nube_a_local` (Filtra filas con `origen_registro = 'nube'`).
  * **Suscripción**: `sub_desde_local` (Apunta a `10.128.0.10`, con `origin = none`).

---

## 📋 Pasos de Ejecución paso a paso

### Paso 1: Configurar e inicializar VM 1 (Hospital Local)

1. Conéctate a la **VM 1** mediante SSH desde Cloud Shell:
   ```bash
   gcloud compute ssh vm-hospital-local --zone=us-central1-a
   ```

2. Clona el repositorio del proyecto y entra al directorio:
   ```bash
   git clone https://github.com/maruzs/Proyecto-OSDS.git Proyecto-OSDS
   cd Proyecto-OSDS
   ```

3. Inicia únicamente los servicios de este nodo (Base de datos local y app de estaciones médicas):
   ```bash
   sudo docker compose up db-local app-estaciones -d
   ```
   *Nota: Al arrancar, `db-local` inicializará el esquema de base de datos y la publicación `pub_local_a_nube` de manera automática.*

4. Desconéctate de la VM 1:
   ```bash
   exit
   ```

---

### Paso 2: Configurar, inicializar e iniciar replicación en VM 2 (Nube Central)

1. Conéctate a la **VM 2** mediante SSH desde Cloud Shell:
   ```bash
   gcloud compute ssh vm-nube-central --zone=us-central1-a
   ```

2. Clona el repositorio del proyecto y entra al directorio:
   ```bash
   git clone https://github.com/maruzs/Proyecto-OSDS.git Proyecto-OSDS
   cd Proyecto-OSDS
   ```

3. Inicia únicamente los servicios de este nodo (Base de datos en la nube y app de admisiones):
   ```bash
   sudo docker compose up db-nube app-terminales -d
   ```

4. Ejecuta el siguiente comando para conectarte al contenedor `db-nube` y crear la suscripción lógica hacia la **VM 1** usando su IP privada (`10.128.0.10`) y la directiva `origin = none`:
   ```bash
   sudo docker exec -i db-nube psql -U postgres -d clinica -c "
   DROP SUBSCRIPTION IF EXISTS sub_desde_local;
   CREATE SUBSCRIPTION sub_desde_local
   CONNECTION 'host=10.128.0.10 port=5432 dbname=clinica user=postgres password=postgres_secure_pass'
   PUBLICATION pub_local_a_nube
   WITH (copy_data = false, origin = none);
   "
   ```

5. Desconéctate de la VM 2:
   ```bash
   exit
   ```

---

### Paso 3: Configurar suscripción de retorno en VM 1 (Hospital Local)

Ya que la publicación de la nube (`pub_nube_a_local`) se ha inicializado en la VM 2, debemos suscribir la VM 1 a ella:

1. Conéctate nuevamente a la **VM 1** por SSH:
   ```bash
   gcloud compute ssh vm-hospital-local --zone=us-central1-a
   ```

2. Ejecuta el comando en el contenedor `db-local` para suscribirte a la **VM 2** usando su IP privada (`10.128.0.20`) y activando `origin = none`:
   ```bash
   sudo docker exec -i db-local psql -U postgres -d clinica -c "
   DROP SUBSCRIPTION IF EXISTS sub_desde_nube;
   CREATE SUBSCRIPTION sub_desde_nube
   CONNECTION 'host=10.128.0.20 port=5432 dbname=clinica user=postgres password=postgres_secure_pass'
   PUBLICATION pub_nube_a_local
   WITH (copy_data = false, origin = none);
   "
   ```

3. Desconéctate de la VM 1:
   ```bash
   exit
   ```

---

## 🔍 Comprobación y QA del Estado de Replicación

Para validar que las réplicas lógicas se han creado de forma exitosa y están activas:

* **En VM 1 (db-local):**
  ```bash
  sudo docker exec -it db-local psql -U postgres -d clinica -c "SELECT subname, subenabled, subpublications FROM pg_subscription;"
  ```

* **En VM 2 (db-nube):**
  ```bash
  sudo docker exec -it db-nube psql -U postgres -d clinica -c "SELECT subname, subenabled, subpublications FROM pg_subscription;"
  ```

Ambos comandos deben retornar su respectiva suscripción (`sub_desde_nube` y `sub_desde_local`) con la columna `subenabled` en `t` (true).
