Infraestructura y simulación de mensajería en tiempo real para entornos de salud digital

Proyecto Sistemas Operativos y Distribuidos

9 de junio de 2026

integrantes: krisstal hernandez, mariano muñoz, felipe martines, maximiliano paredes

# INTRODUCCIÓN

1.  Contexto del problema

Un centro de salud regional necesita modernizar su infraestructura, pasando de un sistema completamente local a uno distribuido. La información clínica de los pacientes debe estar siempre disponible, ya que una falla en el acceso a las fichas puede tener consecuencias directas en la atención médica.

Este proyecto toma como base la propuesta arquitectónica desarrollada en el laboratorio anterior y la lleva a un siguiente nivel, simulando el funcionamiento de dos áreas del centro de salud: las Estaciones Medicas y las Terminales Administrativas. Para esto se desplegaron contenedores Docker con servidores de aplicación, bases de datos con replicación y un proxy inverso Nginx, utilizando WebSockets como mecanismo de comunicación en tiempo real entre los distintos componentes.

2.  Objetivo general

Diseñar y desplegar una arquitectura distribuida que simule la infraestructura tecnológica de un centro de salud, garantizando la disponibilidad, sincronización y seguridad de la información clínica entre sus distintas áreas. La solución debe ser capaz de soportar la comunicación en tiempo real entre los componentes del sistema, mantener la persistencia de los datos ante posibles fallos y operar de forma segura controlando el acceso al tráfico entrante.

3.  Objetivo especifico

(Segmentación de redes, implementación de réplicas lógicas de bases de datos y simulación de la lógica de negocio mediante WebSockets.)

# DISEÑO ARQUITECTONICO Y TOPOLOGIA DE RED

(Esta sección la lidera el **Integrante 3** basado en el diagrama general del hospital)

1.  Descripción de la solución hibrida

(Justificación de la separación entre el entorno físico del hospital (hospital_net) y el entorno remoto de la nube (cloud_net).)

2.  Zona Desmilitarizada (DMZ)

(Explicación de por qué existe la red dmz_net para aislar el tráfico del proxy y el canal de replicación.)

3.  Matriz de conectividad e interfaces

(Tabla técnica que detalla qué contenedores se comunican entre sí, a través de qué puertos y en qué redes virtuales.)

# DETALLE DE COMPONENTES Y MODULOS DE APLICACIÓN

(Aquí es donde cada integrante detalla su código, dependencias y justificación técnica)

1.  Módulo de Estaciones médicas

**Desarrollo Backend WebSocket:** El servidor del módulo de Estaciones Medicas fue desarrollado en Node.js utilizando la librería Socket.io v4.7.5, levantando el servicio en el puerto 8001 bajo el sub-path /ws-medicas/. Esta configuración permite al proxy inverso Nginx identificar y enrutar correctamente el tráfico hacia este módulo de forma independiente al módulo administrativo.

Se implementaron dos eventos principales de comunicación bidireccional:

- consultar_paciente: recibe un RUT como parámetro, consulta la base de datos local y retorna la ficha clínica activa del paciente.

- actualizar_diagnostico: recibe el identificador UUID del registro junto al nuevo diagnóstico, ejecutando una operación UPDATE directa sobre la tabla fichas_pacientes.

**Manejo de caché de alta demanda:** La base de datos local (db-local) corre en un contenedor PostgreSQL 16 dentro de la red hospital_net, aislada de la base de datos de la nube. Actúa como caché de alta demanda, almacenando las fichas clinicias activas de los pacientes en atención, permitiendo que las estaciones medicas operen con baja latencia sin depender de la disponibilidad de la conexión externa.

**Simulación del flujo clínico:** El flujo comienza cuando el módulo administrativo admite un paciente, generando un UUID y almacenando su ficha en la base de datos de la nube. Una vez replicado el registro hacia db-local, el medico puede consultar la ficha ingresando el RUT del paciente desde su estación. Con los datos en pantalla, el medico actualiza el diagnostico usando el UUID del registro, quedando el cambio persistido localmente. Para simular este flujo, se precargaron tres fichas de prueba en db-local al inicializar el contenedor, representando casos clínicos reales como controles crónicos, urgencias y altas médicas.

1.  Módulo de Terminales Administrativas

**Desarrollo de Backend de comunicación síncrona:** Se programa el servidor Node.js usando Socket.io sobre el protocolo WebSocket, configurando el puerto 8002 y el sub-path /ws-administrativas para el enrutamiento del proxy inverso.

**Lógica de negocio e inyección de metadatos:** Se implementa el manejador de eventos admitir_pociente, el que gestiona la concurrencia, mitiga colisiones relacionales mediante la identificadores universales y añade el metadato critico origen_registro:'nube' para activar las reglas de replicación selectiva condicional de PostgreSQL 16.

2.  Módulo Transversal de Infraestructura y Orquestación

(Análisis del archivo docker-compose.yml, persistencia mediante volúmenes de Docker y ciclos de vida de los contenedores.)

3.  Módulo de Seguridad Perimetral y Capa Cliente

(Configuración detallada de Nginx como Reverse Proxy, negociación del protocolo WebSocket (_Protocol Upgrade_) y diseño del frontend base de simulación.)

# MODELO DE DATOS Y ESTRATEGIA DE SINCRONIZACIÓN DISTRIBUIDA

(Sección compartida entre el **Integrante 3** y **2**, ya que impacta directamente a tu base de datos)

1.  Esquema unificado de persistencia

(Estructura de la tabla fichas_pacientes)

2.  Mecanismo de replicación lógica

(Explicación técnica de por qué se usa el nivel WAL lógico (wal_level=logical) en PostgreSQL 16 en lugar de replicación física.)

3.  Mitigación de bucles infinitos de datos

(Justificación del uso de filtros condicionales (WHERE origen_registro = \'nube\') y la directiva origin = none para permitir la sincronización bidireccional asíncrona sin colapsar las bases de datos.)

# ESCENARIOS DE PRUEBA Y VALIDACIÓN DEL SISTEMA

(Sección crítica: aquí van las capturas de pantalla obligatorias del software funcionando)

1.  Escenario 1: Operación normal en tiempo real (WebSockets)

(Captura de la interfaz enviando un paciente desde la admisión y el backend administrativo procesándolo instantáneamente sin recargar el navegador.)

2.  Escenario 2: Sincronización y replicación exitosa

(Captura de pantalla donde se inserta un dato en db-nube y, mediante una consulta SQL en db-local, se demuestra que el dato viajó automáticamente por la red interna.)

3.  Escenario 3: Resiliencia ante caídas de conectividad

(Simulación de la caída de un nodo o corte de red, demostrando la persistencia del archivo WAL y cómo se reanuda la transmisión de datos al levantar el contenedor de nuevo.)

# CONCLUSIONES

(Evaluación del rendimiento de los WebSockets frente a la arquitectura HTTP tradicional en entornos médicos críticos.

Lecciones aprendidas sobre consistencia eventual y replicación de datos distribuidos.)
