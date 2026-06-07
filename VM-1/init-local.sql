CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS fichas_pacientes (
    id UUID PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    diagnostico TEXT,
    origen_registro VARCHAR(50) NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP PUBLICATION IF EXISTS pub_local_a_nube;
CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes WHERE (origen_registro = 'local');

INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
VALUES (
    'f3b2c1a0-d4e5-4a6b-bc7d-8e9f0a1b2c3d', 
    '12345678-9', 
    'Juan Pérez', 
    'DIAGNÓSTICO: Hipertensión arterial crónica controlada. RECETA: Enalapril 10mg cada 12 hrs por 90 días.',
    'local'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 
    '11111111-1', 
    'María Loyola', 
    'DIAGNÓSTICO: Traumatismo menor en tobillo derecho. RECETA: Ibuprofeno 600mg cada 8 hrs por 3 días y reposo muscular.',
    'local'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
VALUES (
    '9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b', 
    '22222222-2', 
    'Carlos Silva', 
    'DIAGNÓSTICO: Bronquitis aguda en fase de resolución. RECETA: Paracetamol 500mg cada 8 hrs en caso de dolor o fiebre.',
    'local'
) ON CONFLICT (id) DO NOTHING;
