# Nodo Nube Central (VM 2) - Proyecto OSDS

Este nodo de la infraestructura distribuida corresponde a la **Nube Central (VM 2)** de la simulación de centro de salud.

## ⚙️ Componentes Locales (VM 2)
*   **`db-nube`**: Base de datos PostgreSQL 16 con el historial clínico consolidado global y replicación lógica activa.
*   **`app-terminales`**: Servidor de backend en Node.js que gestiona el ingreso y admisión de pacientes mediante WebSockets.

---

## 🚀 Instrucciones de Despliegue

### 1. Requisitos previos
Asegúrate de estar en la rama correspondiente:
```bash
git checkout VM2
git pull origin VM2
```

### 2. Iniciar Servicios
Levanta los contenedores en segundo plano:
```bash
sudo docker-compose up --build -d
```

### 3. Configurar Replicación Lógica
Una vez que ambos nodos (VM1 y VM2) estén activos y con los puertos expuestos, inicia la replicación en la base de datos de la nube ejecutando:

```bash
sudo docker exec -it db-nube psql -U postgres -d clinica -c "CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false);"
```

---

## 🛠️ Comandos Útiles

* **Ver estado de los contenedores:**
  ```bash
  sudo docker-compose ps
  ```
* **Ver logs de la Base de Datos (Replicación):**
  ```bash
  sudo docker-compose logs db-nube
  ```
* **Ver logs del Backend:**
  ```bash
  sudo docker-compose logs app-terminales
  ```
