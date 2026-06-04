-- =========================================================================
-- CONFIGURACIÓN DE BASE DE DATOS: HOSPITAL LOCAL (db-local)
-- INTEGRANTE 3 (DevOps) - SISTEMAS OPERATIVOS Y DISTRIBUIDOS
-- =========================================================================

-- Habilitar extensión para UUID (Clave primaria distribuida recomendada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREACIÓN DE LA TABLA COMÚN
CREATE TABLE IF NOT EXISTS fichas_pacientes (
    id UUID PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    diagnostico TEXT,
    origen_registro VARCHAR(50) NOT NULL, -- Campo crucial para el control lógico de replicación
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. EXPLICACIÓN ESTRATEGIA DE PREVENCIÓN DE BUCLES (HITO 2):
-- =========================================================================
-- Cuando se active la replicación bidireccional asíncrona, el mayor peligro 
-- es el bucle infinito: un registro insertado localmente se replica en la nube,
-- y luego la nube re-publica ese mismo cambio enviándolo de regreso al local, 
-- repitiendo el proceso sin fin.
-- 
-- Para evitar este comportamiento usando la columna 'origen_registro':
-- 
-- Opción A: Filtro de Fila en Publicaciones (Soportado nativamente en PG 15+)
--   Definiremos las publicaciones de forma que cada nodo solo envíe registros 
--   que se hayan originado localmente en su propio entorno:
--     * Local: CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes WHERE (origen_registro = 'local');
--     * Nube:  CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes WHERE (origen_registro = 'nube');
--   Dado que un registro replicado conserva su 'origen_registro' original, no cumplirá 
--   la condición de la publicación del otro nodo y no se re-publicará de vuelta.
--
-- Opción B: Opción origin = none en Suscripciones
--   En PostgreSQL 15, al crear la suscripción de retorno, se puede configurar 
--   con la opción 'origin = none'. Esto instruye a la suscripción a replicar
--   únicamente los cambios que no tengan origen de replicación previo, ignorando 
--   cualquier dato que provenga de una replicación previa.
-- =========================================================================

-- 3. CREACIÓN DE LA PUBLICACIÓN LÓGICA LOCAL
DROP PUBLICATION IF EXISTS pub_local_a_nube;
CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes;
