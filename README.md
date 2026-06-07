# Nodo Gateway (VM 3) - Proyecto OSDS

Este nodo de la infraestructura distribuida corresponde al **Gateway (VM 3)** de la simulación de centro de salud.

## ⚙️ Componentes Locales (VM 3)
*   **`nginx-proxy`**: Servidor Nginx que actúa como proxy inverso y balanceador de WebSockets, gestionando la encriptación y ruteando las peticiones a la VM1 y VM2.
*   **`cloudflare-tunnel`**: Cliente de Cloudflare que establece un túnel seguro con SSL/TLS legítimo para el subdominio `osdsp3.epistia.cl` sin exponer puertos del host al exterior.

---

## 🚀 Instrucciones de Despliegue

### 1. Requisitos previos
Asegúrate de estar en la rama correspondiente:
```bash
git checkout VM3
git pull origin VM3
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en el directorio raíz con tu token de Cloudflare:
```bash
echo "TUNNEL_TOKEN=TU_TOKEN_DE_CLOUDFLARE" > .env
```

### 3. Iniciar Servicios
Levanta los contenedores limpiando cualquier contenedor antiguo o huérfano:
```bash
sudo docker rm -f nginx-proxy cloudflare-tunnel app-terminales app-estaciones db-local db-nube
sudo docker-compose up -d --remove-orphans
```

---

## 🛠️ Comandos Útiles

* **Ver estado de los contenedores:**
  ```bash
  sudo docker-compose ps
  ```
* **Ver logs de Nginx Proxy:**
  ```bash
  sudo docker-compose logs nginx-proxy
  ```
* **Ver logs del Túnel de Cloudflare:**
  ```bash
  sudo docker logs cloudflare-tunnel
  ```
