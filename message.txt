====================================================================
PLANIFICACIÓN DE PROYECTO: SIMULACIÓN DE ARQUITECTURA DISTRIBUIDA
====================================================================
Asignatura: Sistemas Operativos y Distribuidos
Evaluación: Proyecto Unidad 2
Ponderaciones: 
* Producto Computacional: 30%
* Informe de Proyecto: 10%
* Presentación (Evaluación Individual): 20%
Fecha de Entrega: Martes 9 de junio, hasta las 08:30 hrs
Equipo: 4 Integrantes

--- ALCANCE DEL PROYECTO ---
El enfoque principal del proyecto está en la arquitectura que permita soportar el despliegue de las aplicaciones, utilizando máquinas virtuales y/o contenedores. Se simula el uso de dos áreas específicas del centro de salud: Estaciones Médicas (Fichas Clínicas) y Terminales Administrativas. El sistema incorpora el uso de WebSocket en la comunicación, bases de datos con al menos una réplica y un elemento de seguridad perimetral. El informe detallará los componentes, sus relaciones, tecnologías y las capturas de pantalla de los escenarios de prueba.

--- DISTRIBUCIÓN EQUITATIVA DE ROLES Y TAREAS ---

INTEGRANTE 1: MÓDULO ÁREA DE ESTACIONES MÉDICAS (Aplicación + BD Local)
* Responsable del desarrollo del entorno de atención clínica y consulta de fichas.
* Desarrollo Backend (WebSockets): 
  - Crear el servidor WebSocket local que gestione y reciba las solicitudes de actualización o consulta de fichas clínicas en tiempo real.
  - Implementar los scripts que simulen la carga de datos del paciente (diagnósticos, recetas).
* Persistencia Local: 
  - Configurar y levantar el contenedor Docker o VM de la Base de Datos de caché física local encargada de almacenar las fichas activas de alta demanda.
* Entregables de Informe: 
  - Redactar el apartado técnico del comportamiento del flujo de las Estaciones Médicas en el documento final.
  - Adjuntar las capturas de pantalla de los escenarios de prueba correspondientes a este módulo.

INTEGRANTE 2: MÓDULO ÁREA DE TERMINALES ADMINISTRATIVAS (Aplicación + BD Nube)
* Responsable del entorno de gestión de agendas, ingresos y persistencia core histórica.
* Desarrollo Backend (WebSockets): 
  - Crear el servicio que envíe y reciba actualizaciones en tiempo real mediante WebSockets para las tareas administrativas (admisión de pacientes, agendamiento de horas).
* Persistencia Global (Nube): 
  - Configurar y levantar el contenedor o VM de la Base de Datos principal que simula el entorno de la nube para el grueso histórico y registros administrativos centralizados.
* Entregables de Informe: 
  - Redactar la sección del informe dedicada a la lógica de negocio de las Terminales Administrativas.
  - Capturar los escenarios de prueba de admisión y procesamiento de datos administrativos.

INTEGRANTE 3: MÓDULO TRANSVERSAL DE INFRAESTRUCTURA Y RÉPLICA (DevOps)
* Responsable de unificar los módulos independientes en una topología lógica común.
* Orquestación General (Docker-Compose / VMs): 
  - Diseñar y unificar el entorno de red y soporte de despliegue de las dos aplicaciones del proyecto.
  - Construir el archivo docker-compose.yml o scripts de despliegue que monten las aplicaciones y las bases de datos en sus respectivos segmentos lógicos (Entorno Local del Hospital vs. Entorno de la Nube).
* Mecanismo de Réplica Requerido: 
  - Configurar e implementar la replicación obligatoria exigida en las bases del proyecto para asegurar la sincronización asíncrona entre la base de datos de caché local y la base de datos central de la nube.
* Entregables de Informe: 
  - Redactar el apartado de infraestructura detallando la topología de red, el soporte de despliegue y los elementos tecnológicos implementados.

INTEGRANTE 4: MÓDULO TRANSVERSAL DE SEGURIDAD Y QA (SecOps / QA)
* Responsable de blindar la arquitectura y validar el flujo de extremo a extremo.
* Elemento de Seguridad Perimetral: 
  - Configurar un Proxy Inverso (Nginx) o una Pasarela API ligera que intercepte, valide y proteja las conexiones WebSocket de las Estaciones Médicas y Terminales Administrativas.
* Frontend de Simulación: 
  - Desarrollar una interfaz gráfica HTML/JS muy simple con paneles básicos para interactuar visualmente con las aplicaciones WebSocket de los Integrantes 1 y 2, facilitando la ejecución de los flujos y pruebas integrales.
* Entregables de Informe y Coordinación: 
  - Escribir el capítulo de seguridad del informe y consolidar las secciones de todos los compañeros en el documento único de entrega.
  - Estructurar el material de apoyo visual de la presentación grupal para la defensa.

--- CRONOGRAMA CRÍTICO DE HITOS INTERNOS ---

* Hito 1 (Viernes 05/06) - Desarrollo Aislado: Los integrantes 1 y 2 terminan sus servicios WebSocket y sus contenedores de BD corriendo por separado.
* Hito 2 (Domingo 07/06) - Ensamble de la Arquitectura: El Integrante 3 acopla todo en el archivo de orquestación global y activa las réplicas. El Integrante 4 conecta el proxy de seguridad y la interfaz de control.
* Hito 3 (Lunes 08/06) - Control de Calidad y Ensayo: Se ejecutan las simulaciones completas para extraer las capturas del informe, se consolida el documento final y se ensaya la exposición grupal enfocada en el proceso de creación de la arquitectura.