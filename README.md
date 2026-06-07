# Nodo Hospital Local (VM 1) - Proyecto OSDS

Este nodo de la infraestructura distribuida corresponde al **Hospital Local (VM 1)** de la simulación de centro de salud.

## ⚙️ Componentes Locales (VM 1)
*   **`db-local`**: Base de datos PostgreSQL 16 con los datos de alta demanda y caché local, además de publicación activa para replicación lógica.
*   **`app-estaciones`**: Servidor de backend en Node.js que gestiona consultas y actualizaciones de fichas clínicas mediante WebSockets.

---

## 🚀 Instrucciones de Despliegue

### 1. Requisitos previos
Asegúrate de estar en la rama correspondiente:
```bash
git checkout VM1
git pull origin VM1
```

### 2. Iniciar Servicios
Levanta los contenedores en segundo plano:
```bash
sudo docker-compose up --build -d
```

### 3. Configurar Replicación Lógica
Una vez que ambos nodos (VM1 y VM2) estén activos y con los puertos expuestos, inicia la replicación en la base de datos local ejecutando:

```bash
sudo docker exec -it db-local psql -U postgres -d clinica -c "CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=db-nube port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false);"
```

---

## 🛠️ Comandos Útiles

* **Ver estado de los contenedores:**
  ```bash
  sudo docker-compose ps
  ```
* **Ver logs de la Base de Datos (Replicación):**
  ```bash
  sudo docker-compose logs db-local
  ```
* **Ver logs del Backend:**
  ```bash
  sudo docker-compose logs app-estaciones
  ```
