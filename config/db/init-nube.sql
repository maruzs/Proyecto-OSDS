CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS fichas_pacientes (
    id UUID PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    diagnostico TEXT,
    origen_registro VARCHAR(50) NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP PUBLICATION IF EXISTS pub_nube_a_local;
CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes WHERE (origen_registro = 'nube');

DROP SUBSCRIPTION IF EXISTS sub_desde_local;
CREATE SUBSCRIPTION sub_desde_local
CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass'
PUBLICATION pub_local_a_nube
WITH (copy_data = false);
