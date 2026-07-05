CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS fichas_pacientes (
    id UUID PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    diagnostico TEXT,
    origen_registro VARCHAR(50) NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE fichas_pacientes REPLICA IDENTITY FULL;

DROP PUBLICATION IF EXISTS pub_nube_a_local;
CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes WHERE (origen_registro = 'nube');

-- Crear rol de replicación física para db-nube-replica
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'repl_secure_pass';
