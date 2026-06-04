# Proyecto Gestión de Bases de Datos
**Rodrigo Pavez Madariaga** - rpavez@utalca.cl  
**Caso:** Base de Datos Activa para Tienda en Línea  
*UNIVERSIDAD DE TALCA - CHILE*  
*INGENIERÍA CIVIL EN COMPUTACIÓN (icc)*  

---

La empresa comercializadora de productos al detalle **"CompraYa"**, tiene una amplia trayectoria en la venta de diversos productos de forma presencial en su local. Últimamente sus ventas se han visto afectadas, principalmente por el cambio tecnológico, ya que no tienen presencia en Internet. Frente a esto, están dispuestos a realizar una inversión que permita acercar la venta de sus productos a los clientes, estableciendo un medio de venta digital a través de una tienda en línea.

## Objetivos Principales del Sistema
* Mantener actualizados los datos de productos, stock, pedidos, pagos y clientes.
* Automatizar tareas clave como el cálculo de totales, actualización de inventario y registro de eventos.
* Registrar y controlar el proceso de envío y entrega de productos.
* Validar que los clientes sean mayores de edad y tengan un RUT chileno válido.
* Permitir conocer y consultar información del personal involucrado en ventas y distribución.
* Facilitar la generación de reportes analíticos y de auditoría.
* Notificar automáticamente al cliente sobre cualquier cambio en el estado de su pedido y despacho.
* Detectar y gestionar productos en condición de stock crítico para evitar quiebres de inventario.

---

## Estructura Inicial del Modelo de Datos
Como parte del desarrollo inicial, se dispone de un modelo entidad relación (ER) para la implementación de la base de datos, pero no están seguros si esta podrá cubrir todas sus necesidades, por lo que se debe asesorar adecuadamente y establecer los cambios pertinentes que permitan abordar todos sus requerimientos.

### Relaciones del Modelo
* **Clientes** `realiza` **Pedidos**
* **Personal** `vende` **Pedidos**
* **Personal** `distribuye` **Envios**
* **Productos** `incluye` **Detalle_Pedido**
* **Pedidos** `contiene` **Detalle_Pedido**
* **Pedidos** `tiene` **Pagos**
* **Pedidos** `genera` **Auditoria_Pedidos**
* **Pedidos** `registra` **Envios**

### Diccionario de Tablas y Atributos

#### 1. Clientes
* `cliente_id`: int «PK»
* `nombre`: varchar
* `correo_electronico`: varchar «UNIQUE, NOT NULL»
* `telefono`: varchar
* `direccion`: varchar
* `fecha_nacimiento`: date «NOT NULL»
* `rut`: varchar «UNIQUE, NOT NULL»
* `fecha_registro`: datetime

#### 2. Personal
* `personal_id`: int «PK»
* `nombre`: varchar
* `rol`: varchar
* `correo`: varchar
* `telefono`: varchar

#### 3. Productos
* `producto_id`: int «PK»
* `nombre`: varchar
* `descripcion`: text
* `precio`: decimal
* `stock`: int
* `categoria`: varchar
* `activo`: boolean

#### 4. Pedidos
* `pedido_id`: int «PK»
* `cliente_id`: int «FK»
* `vendedor_id`: int «FK»
* `fecha_pedido`: datetime
* `estado`: varchar
* `total`: decimal

#### 5. Detalle_Pedido
* `detalle_id`: int «PK»
* `pedido_id`: int «FK»
* `producto_id`: int «FK»
* `cantidad`: int
* `precio_unitario`: decimal

#### 6. Pagos
* `pago_id`: int «PK»
* `pedido_id`: int «FK»
* `fecha_pago`: datetime
* `monto`: decimal
* `metodo_pago`: varchar
* `estado_pago`: varchar

#### 7. Auditoria_Pedidos
* `auditoria_id`: int «PK»
* `pedido_id`: int «FK»
* `estado_anterior`: varchar
* `estado_nuevo`: varchar
* `fecha_cambio`: datetime
* `usuario_cambio`: varchar

#### 8. Envios
* `envio_id`: int «PK»
* `pedido_id`: int «FK»
* `distribuidor_id`: int «FK»
* `estado_envio`: varchar
* `fecha_envio`: datetime
* `fecha_entrega`: datetime
* `tracking`: varchar

---

## Requisitos Funcionales y Técnicos
A continuación, se presentan los distintos elementos a validar para la implementación de la base de datos.

### Validaciones Obligatorias
* Validar que los clientes tengan al menos 18 años al momento del registro.
* Validar que el RUT ingresado esté correcto, considerando el algoritmo de validación del rut chileno. El rut debe mantener un formato estándar en toda la base de datos, el que podría ser `##.###.###-X` o `########-X`, por lo que independiente de cómo sea ingresado, este deberá ser formateado al llegar a la base de datos.
* No permitir pedidos de productos inactivos o sin stock suficiente.
* Verificar que la fecha de despacho de un producto no exceda más de 2 días luego de la compra del producto.
* Verificar que la fecha de envío no sea anterior a la fecha de venta y que la fecha de entrega no sea anterior a la fecha de venta y envío.

### Triggers
* **A.** Descontar stock al insertar un `Detalle_Pedido`.
* **B.** Registrar cambios de estado del pedido en `Auditoria_Pedidos`.
* **C.** Registrar inicio de proceso de envío al cambiar el estado del pedido a 'procesado'.
* **D.** Disparar una notificación automática al cliente cada vez que cambie el estado del pedido o del envío.
* **E.** Bloquear eliminación de clientes con pedidos activos.
* **F.** Prevenir asignación de pedidos a personal no registrado o inactivo.
* **G.** Detectar cuando el stock de un producto cae por debajo de un umbral definido y registrar esta condición como "stock crítico".
* **H.** Gestión de historial de transacciones sobre operaciones esenciales para el seguimiento de la venta, despacho y entrega de productos.

### Procedimientos Almacenados
* **A.** Calcular y actualizar el total del pedido.
* **B.** Registrar pago y verificar su validez.
* **C.** Generar reporte mensual de ventas por vendedor.
* **D.** Generar informe de entregas por distribuidor.
* **E.** Enviar notificaciones de actualización de estado de pedido a los clientes.
* **F.** Actualizar umbrales de stock crítico por producto.

### Vistas
* **A. Historial_Cliente:** Muestra todos los pedidos y pagos por cliente.
* **B. Productos_Bajo_Stock:** Productos con stock crítico.
* **C. Seguimiento_Envios:** Consulta de pedidos, estados de envío y responsables.
* **D. Ventas_Por_Vendedor:** Muestra totales por personal de ventas.
* **E. Entregas_Por_Distribuidor:** Listado de entregas por distribuidor.
* **F. Notificaciones_Cliente:** Historial de notificaciones enviadas a clientes.
* **G. Alerta_Stock_Critico:** Productos con stock por debajo del umbral mínimo.

### Funciones y Reglas
* **A. validar_rut_chileno(rut TEXT):** Verifica formato y dígito verificador.
* **B. es_mayor_edad(fecha_nacimiento DATE):** Retorna TRUE si el cliente es mayor de 18 años.
* **C. es_stock_critico(producto_id INT):** Retorna TRUE si el stock actual es menor o igual al umbral definido para ese producto.
* **D.** Reglas que impiden registrar clientes que no cumplan los requisitos de edad o validez de RUT.

### Reglas de Negocio Avanzadas
Con la idea de darle mayor realismo a la aplicación se deberán considerar las siguientes reglas adicionales del negocio. Estas podrán requerir la incorporación de columnas dentro de las tablas actuales o incluso, nuevas tablas dentro del modelo.

1. Un cliente no puede generar pedidos si:
   * supera su límite de crédito
   * tiene pagos pendientes vencidos
   * está en estado bloqueado o moroso
2. Si un cliente genera más de 5 pedidos en 10 minutos, marcar como sospechoso.
3. Un distribuidor no puede tener más envíos asignados que su capacidad diaria.
4. El flujo de los pedidos solo puede mantener el estado en el siguiente orden: `pendiente` $\rightarrow$ `procesado` $\rightarrow$ `enviado` $\rightarrow$ `entregado`. No se puede retroceder estado.
5. El total del pedido debe coincidir con la suma del detalle.

---

## Consideraciones Finales
La implementación por realizar deberá disponer de los archivos separados, indicando el orden en cómo estos deben ser ejecutados. Su solución deberá incluir un Script con datos válidos, los que serán cargados respetando el orden que se establezca previamente. Estos datos incluidos deberán permitir la generación de reportes de indicadores de gestión, por lo que los datos deben tener coherencia. Si bien no se especifica una "cantidad mínima", la idea es que el reporte pueda ser construido y tenga sentido al hacer su análisis.

Adicionalmente, se debe presentar un Script que contenga diversos escenarios de pruebas, los que deberán venir documentados indicando el tipo de prueba que desempeña, los parámetros de entrada y salidas generadas, incluso si esta corresponde a una excepción por un caso de prueba no aprobado.

### Entrega
El trabajo puede ser desarrollado de forma individual o en equipos de hasta dos integrantes. Su entrega debe considerar dos elementos:
1. Los distintos Script de su base de datos, incluyendo los datos y los escenarios de prueba.
2. Informe técnico con el desarrollo del proyecto, donde deberá dar énfasis en la lógica que fue implementada para construir su base de datos activa y los resultados de las distintas acciones.

**Fecha de entrega:** Lunes 8 de junio, antes de las 23:59 hrs. a través de Educandus.

Adicionalmente, todos los estudiantes deben realizar una presentación en la que demostrarán el correcto funcionamiento de su base de datos activa. Las presentaciones comenzarán el miércoles 10 de Junio y se extenderán hasta el viernes 12 de Junio.

### Evaluación
Este proyecto tiene la siguiente distribución respecto a los porcentajes de la unidad 2 del módulo:
* **25%** - Producto Computacional
* **10%** - Informe de Proyecto
* **15%** - Presentación Oral


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