-- Configuración inicial de la Base de Datos Central MySQL (db-central)
CREATE DATABASE IF NOT EXISTS clinica_central;
USE clinica_central;

-- Tabla para almacenar registros consolidados de admisión
CREATE TABLE IF NOT EXISTS registro_admisiones (
    id VARCHAR(36) PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    origen VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar auditoría consolidada de diagnósticos y tratamientos
CREATE TABLE IF NOT EXISTS auditoria_diagnosticos (
    id VARCHAR(36) PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    diagnostico TEXT,
    origen VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para inventario de bodega de insumos médicos
CREATE TABLE IF NOT EXISTS inventario_insumos (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    stock INT NOT NULL,
    descripcion VARCHAR(255)
);

-- Crear usuario para la replicación física de MySQL
CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED BY 'repl_secure_pass';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

-- Cargar stock inicial en bodega
INSERT IGNORE INTO inventario_insumos (codigo, nombre, stock, descripcion)
VALUES
('INS-001', 'Paracetamol 500mg', 500, 'Analgesico y antipiretico comun'),
('INS-002', 'Ibuprofeno 600mg', 300, 'Antiinflamatorio no esteroideo'),
('INS-003', 'Enalapril 10mg', 400, 'Antihipertensivo utilizado en tratamientos cronicos'),
('INS-004', 'Jeringa Desechable 5ml', 1000, 'Insumo de inyeccion clinica estandar'),
('INS-005', 'Suero Fisiologico 500ml', 200, 'Solucion salina para rehidratacion y limpieza');
