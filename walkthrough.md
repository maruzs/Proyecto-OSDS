# Walkthrough - Despliegue Distribuido en 3 VMs en GCP

Este documento detalla la reestructuración del proyecto para su despliegue distribuido real en **3 Máquinas Virtuales independientes en Google Cloud Platform (GCP)**.

---

## 🛠️ Estructura de Carpetas

Para facilitar el despliegue en cada máquina virtual, el proyecto se ha dividido en tres directorios principales en la raíz del repositorio de la rama `pruebaFinal`:

```text
.
├── VM-1/                    # Para vm-hospital-local (10.128.0.10)
│   ├── docker-compose.yml   # Orquesta db-local y app-estaciones (expone 5432 y 8001)
│   └── init-local.sql       # Inicializa esquema y publicación local
│
├── VM-2/                    # Para vm-nube-central (10.128.0.20)
│   ├── docker-compose.yml   # Orquesta db-nube y app-terminales (expone 5432 y 8002)
│   └── init-nube.sql        # Inicializa esquema y publicación nube
│
├── VM-3/                    # Para vm-gateway (10.128.0.30)
│   ├── docker-compose.yml   # Orquesta el proxy inverso Nginx (expone 80 y 443)
│   └── nginx.conf           # Hardening de Nginx y proxying a VM-1 (8001) y VM-2 (8002)
│
├── setup-replication.sh     # Script automatizado para ejecutar en Cloud Shell
└── README.md
```

---

## 🚀 Guía de Despliegue Paso a Paso (Desde Cloud Shell)

### Paso 1: Configurar las VMs
Asegúrate de que tus 3 VMs (`vm-hospital-local`, `vm-nube-central`, `vm-gateway`) tengan Docker y Docker Compose V2 instalado ejecutando los comandos iniciales provistos en tu guía.

---

### Paso 2: Clonar y Levantar los Servicios en cada VM

Ejecuta estos bloques de comandos directamente en tu terminal de **Cloud Shell**:

#### 1. Desplegar VM-1 (Hospital Local):
```bash
gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="
  git clone -b pruebaFinal https://github.com/maruzs/Proyecto-OSDS.git Proyecto-OSDS || (cd Proyecto-OSDS && git fetch && git checkout pruebaFinal && git pull)
  cd Proyecto-OSDS/VM-1
  sudo docker-compose down -v
  sudo docker-compose up --build -d
"
```

#### 2. Desplegar VM-2 (Nube Central):
```bash
gcloud compute ssh vm-nube-central --zone=us-central1-a --command="
  git clone -b pruebaFinal https://github.com/maruzs/Proyecto-OSDS.git Proyecto-OSDS || (cd Proyecto-OSDS && git fetch && git checkout pruebaFinal && git pull)
  cd Proyecto-OSDS/VM-2
  sudo docker-compose down -v
  sudo docker-compose up --build -d
"
```

#### 3. Desplegar VM-3 (Gateway Perimetral):
```bash
gcloud compute ssh vm-gateway --zone=us-central1-a --command="
  git clone -b pruebaFinal https://github.com/maruzs/Proyecto-OSDS.git Proyecto-OSDS || (cd Proyecto-OSDS && git fetch && git checkout pruebaFinal && git pull)
  cd Proyecto-OSDS/VM-3
  sudo docker-compose down -v
  sudo docker-compose up --build -d
"
```

---

### Paso 3: Inicializar la Replicación Lógica Bidireccional
Las publicaciones de bases de datos se crean automáticamente durante la inicialización de los contenedores. Sin embargo, para enlazar las bases de datos (crear las suscripciones de red), ejecuta el script automatizado que creamos en tu terminal de **Cloud Shell**:

```bash
# Dar permisos de ejecución al script local
chmod +x setup-replication.sh

# Ejecutar el script (que enviará los comandos CREATE SUBSCRIPTION a las VMs por SSH)
./setup-replication.sh
```

---

## 🔍 Verificación del Despliegue

1. **Acceso Web**: Abre en tu navegador la IP pública de `vm-gateway` (`http://34.136.241.52`).
2. **Conexión WebSockets**: Verifica en la cabecera que los badges marquen "Conectado" en color verde para ambos servicios.
3. **Flujo de Replicación**:
   - Registra un paciente en el panel de **Admisiones en la Nube**.
   - Busca al paciente por su RUT en el panel de **Estaciones Médicas (Local)**. El registro debe aparecer de inmediato gracias a la replicación en red.
   - Modifica el diagnóstico localmente y confirma que el cambio se replique de vuelta a la base de datos de la nube.
