-- Configuración inicial de Base de Datos MariaDB - Hospital Local (Master)
CREATE DATABASE IF NOT EXISTS clinica;
USE clinica;

CREATE TABLE IF NOT EXISTS fichas_pacientes (
    id VARCHAR(36) PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    diagnostico TEXT,
    origen_registro VARCHAR(50) NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear usuario para replicación MariaDB
CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED BY 'repl_secure_pass';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

-- Precargar datos clínicos de prueba en el Hospital Local
INSERT IGNORE INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
VALUES 
('f3b2c1a0-d4e5-4a6b-bc7d-8e9f0a1b2c3d', '12345678-9', 'Juan Perez', 'DIAGNOSTICO: Hipertension arterial cronica controlada. RECETA: Enalapril 10mg.', 'local'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '11111111-1', 'Maria Loyola', 'DIAGNOSTICO: Traumatismo menor en tobillo derecho. RECETA: Ibuprofeno 600mg.', 'local'),
('9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b', '22222222-2', 'Carlos Silva', 'DIAGNOSTICO: Bronquitis aguda en fase de resolucion. RECETA: Paracetamol 500mg.', 'local');