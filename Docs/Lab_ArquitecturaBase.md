# Sistemas Operativos y Distribuidos

## Propuesta de Arquitectura Base

---

## Descripción General

Un centro de salud de referencia en la región requiere implantar una actualización en sus sistemas informáticos, pasando desde un trabajo en forma 100% local a un procesamiento distribuido en datos y cómputo. Actualmente se mantienen varios sistemas de áreas específicas y uno de propósito general que permite agendar y mantener la ficha de los pacientes.

Inicialmente se ha mantenido todo de forma local por seguridad y falta de equipamiento adecuado, ya que la manipulación de fichas clínicas es una alta responsabilidad, teniendo incluso que asegurar la permanencia de datos por al menos 5 años.

---

## Descripción General

El listado de software “independiente” que utilizan es más o menos el siguiente:

- Contador y llamado de pacientes por ticket de atención.
- Sistema de almacenamiento de exámenes de laboratorio, es de alto cómputo ya que requiere un enlace directo con algunas de las máquinas del laboratorio.
- Sistema de remuneraciones.
- Intranet para empleados.
- Sistema de bodega e inventario.
- Sistema de flujo de pabellón.
- Sistema de planificación de pabellón.
- Sistema de fichas de atención de pacientes.

Hoy todos estos sistemas requieren una autenticación y no todo el personal puede ver todos los sistemas.

Actualmente, los sistemas que están destacados trabajan sobre una misma base de datos.

Un dato muy importante por considerar es que el sistema de fichas y flujo de pabellón deben mantener una alta disponibilidad, puesto que un fallo en esto podría implicar un error grave en la intervención quirúrgica de los distintos pacientes y debe ser accedido solo por personal autorizado.

---

## Descripción General

### Contador y llamado de pacientes por ticket de atención:

Al ingresar un paciente al centro médico se le otorga un número de atención, por el cual será llamado desde el mesón de ingreso, coordinación de pabellón o desde la propia consulta médica. Cada área cuenta con su interfaz para realizar el llamado, lo que se verá reflejado en las pantallas. En el caso de los pacientes que se dirigen a consultas médicas, en este espacio se debe dejar registro del pago de la atención.

### Sistema de almacenamiento de exámenes de laboratorio:

Es accedido por el personal del laboratorio, para planificar los distintos exámenes. Una vez que se realiza el examen, las distintas máquinas de laboratorio dejan el documento e informe en un repositorio, el cual podrá ser accedido por los médicos. El sistema de ficha rescata datos desde este sistema, pero solo para desplegarlo como parte de la ficha.

### Sistema de remuneraciones:

Permite que el personal de recursos humanos realice los pagos de sueldos y honorarios a los administrativos y médicos del centro de salud.

### Intranet para empleados:

Espacio para que los distintos empleados administrativos realicen solicitudes de permisos, revisen su liquidación de sueldo y mantengan registros de sus antecedentes personales.

### Sistema de bodega e inventario:

Es un solo sistema, pero con dos módulos. Por una parte, el sistema de bodega permite registrar y distribuir los insumos que pueden ser utilizados en pabellón y consultas médicas. Mientras que el sistema de inventario permite registrar productos (medicamentos) que podrán ser vendidos a los pacientes.

### Sistema de flujo de pabellón:

Permite dar seguimiento al paciente al momento que es ingresado a pabellón. Desde la recepción se realiza el ingreso y todo lo que ocurre dentro del pabellón debe quedar registrado. Las etapas que involucra son: Recepción, Preparación, Anestesia, Pabellón, Recuperación y Alta. En cada parte del flujo solo puede intervenir el personal médico o de enfermería. Al término de la cirugía el médico tratante deberá dejar registro del procedimiento en la ficha del paciente.

### Sistema de planificación de pabellón:

Permite al personal de Coordinación de Pabellón planificar las distintas cirugías por día, relacionando a pacientes con equipo médico. La conformación del equipo médico debe ser: Médico principal, Médico ayudante (opcional), Anestesista (opcional), Arsenalera, Enfermera.

### Sistema de fichas de atención de pacientes:

Se podría considerar el sistema más importante, ya que es acá donde se deja el registro de toda la información del paciente. Desde agenda de consultas médicas, diagnósticos, derivación a realización de exámenes (el resultado no se aloja acá, solo se consulta para mostrarlo como parte de la ficha), recetas de medicamentos y realización de procedimientos quirúrgicos. Se debe asegurar la persistencia de una ficha por al menos 5 años. El acceso a los datos de pacientes solo puede ser por personal autorizado (médicos y/o enfermería).

---

## Se pide

Con la idea de actualizar su infraestructura, el área de TI debe hacer un cambio importante en su actual forma de trabajo, por lo que está solicitando propuestas que puedan mantener la persistencia, confiabilidad, transparencia y seguridad de la información.

Usted junto a dos compañeros, deberá presentar una arquitectura como alternativa de su solución, analizando la capacidad de integración de algunos sistemas o creación de middleware si fuera necesario.

El diseño podrá ser creado en alguna herramienta como draw.io, Lucidchart o alguna herramienta gráfica.

La propuesta deberá considerar un diagrama “tipo” de la arquitectura, dando características y alternativas tecnológicas en las distintas áreas que comprende su propuesta.

La entrega se desarrollará en dos etapas, un primer avance hoy durante la hora de laboratorio y el diagrama definitivo deberá ser expuesto brevemente el martes 26 de mayo, en la hora de clases.

La primera entrega consiste en un borrador del diagrama, logrando establecer la separación total o parcial de algunos de los sistemas y/o almacenes de datos.
