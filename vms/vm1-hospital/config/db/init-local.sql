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

-- Crear rol de replicación física para db-local-replica
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'repl_secure_pass';

-- Precargar datos clínicos de prueba en el Hospital Local
INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
VALUES 
('f3b2c1a0-d4e5-4a6b-bc7d-8e9f0a1b2c3d', '12345678-9', 'Juan Perez', 'DIAGNOSTICO: Hipertension arterial cronica controlada. RECETA: Enalapril 10mg.', 'local'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '11111111-1', 'Maria Loyola', 'DIAGNOSTICO: Traumatismo menor en tobillo derecho. RECETA: Ibuprofeno 600mg.', 'local'),
('9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b', '22222222-2', 'Carlos Silva', 'DIAGNOSTICO: Bronquitis aguda en fase de resolucion. RECETA: Paracetamol 500mg.', 'local')
ON CONFLICT (id) DO NOTHING;