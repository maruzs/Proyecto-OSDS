const express = require('express');
const cors = require('cors');
const { Pool, Client } = require('pg');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8000;

const HOSPITAL_APP_URL = process.env.HOSPITAL_APP_URL || 'http://10.128.0.10:8001';

// Configuración de PostgreSQL Central (a través del proxy)
const pgCentralConfig = {
    host: process.env.DB_CENTRAL_HOST || 'db-central-proxy',
    port: parseInt(process.env.DB_CENTRAL_PORT || '5432'),
    user: process.env.DB_CENTRAL_USER || 'postgres',
    password: process.env.DB_CENTRAL_PASSWORD || 'postgres_secure_pass',
    database: process.env.DB_CENTRAL_NAME || 'clinica_central',
    connectionTimeoutMillis: 5000
};

// Configuración de PostgreSQL de contingencia
const pgContingenciaConfig = {
    host: process.env.DB_CONTINGENCIA_HOST || 'db-contingencia',
    port: parseInt(process.env.DB_CONTINGENCIA_PORT || '5432'),
    user: process.env.DB_CONTINGENCIA_USER || 'postgres',
    password: process.env.DB_CONTINGENCIA_PASSWORD || 'postgres_secure_pass',
    database: process.env.DB_CONTINGENCIA_NAME || 'contingencia',
    connectionTimeoutMillis: 5000
};

// URL de la App de Bodega
const BODEGA_APP_URL = process.env.BODEGA_APP_URL || 'http://app-bodega:8003';

// ------------------------------------------------------------------------------
// Base de datos PostgreSQL de contingencia (Local en VM3)
// ------------------------------------------------------------------------------
const contingenciaPool = new Pool(pgContingenciaConfig);

async function initContingenciaDb() {
    try {
        await contingenciaPool.query(`
            CREATE TABLE IF NOT EXISTS cola_contingencia (
                id SERIAL PRIMARY KEY,
                tipo VARCHAR(50) NOT NULL,
                payload TEXT NOT NULL,
                intentos INTEGER DEFAULT 0,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[POSTGRES] Tabla de contingencia inicializada.');
    } catch (err) {
        console.error('[POSTGRES] Error inicializando tabla de contingencia:', err);
    }
}
initContingenciaDb();

// Helper para insertar en contingencia
async function encolarContingencia(tipo, payload) {
    const sql = 'INSERT INTO cola_contingencia (tipo, payload) VALUES ($1, $2) RETURNING id';
    try {
        const res = await contingenciaPool.query(sql, [tipo, JSON.stringify(payload)]);
        const insertId = res.rows[0].id;
        console.log(`[POSTGRES] Sincronización diferida encolada. ID: ${insertId}`);
        return insertId;
    } catch (err) {
        console.error('[POSTGRES] Error al encolar:', err);
        throw err;
    }
}

// ------------------------------------------------------------------------------
// Endpoints del Middleware
// ------------------------------------------------------------------------------

// 1. Registro de Pacientes (Consolidación desde App 2)
app.post('/api/mw/pacientes', async (req, res) => {
    const { id, rut, nombre, diagnostico, origen_registro } = req.body;
    console.log(`[MIDDLEWARE] Procesando admisión del paciente: ${nombre} (${rut})`);

    if (!id || !rut || !nombre) {
        return res.status(400).json({ error: 'Campos id, rut y nombre son requeridos.' });
    }

    const payload = { id, rut, nombre, diagnostico, origen: origen_registro || 'desconocido' };

    let client;
    try {
        client = new Client(pgCentralConfig);
        await client.connect();
        await client.query(
            'INSERT INTO registro_admisiones (id, rut, nombre, origen) VALUES ($1, $2, $3, $4)',
            [payload.id, payload.rut, payload.nombre, payload.origen]
        );
        console.log(`[MIDDLEWARE] Sincronización inmediata en DB Central (Paciente ID: ${id})`);
    } catch (err) {
        console.error('[MIDDLEWARE_ERROR] Base de datos central no responde. Guardando en contingencia:', err.message);
        await encolarContingencia('ADMITIR_PACIENTE', payload);
    } finally {
        if (client) await client.end();
    }

    // Reenviar la admisión al Hospital Local (VM1) para que quede disponible en Estaciones Médicas
    try {
        await axios.post(`${HOSPITAL_APP_URL}/api/pacientes/sincronizar`, {
            id, rut, nombre, diagnostico, origen_registro: origen_registro || 'nube'
        });
        console.log(`[MIDDLEWARE] Paciente ${rut} sincronizado con éxito en Hospital Local (VM1).`);
    } catch (errHospital) {
        console.error(`[MIDDLEWARE_ERROR] Error al sincronizar con Hospital Local: ${errHospital.message}. Encolando.`);
        await encolarContingencia('SINCRONIZAR_HOSPITAL', payload);
    }

    res.json({ status: 'OK', message: 'Paciente procesado.' });
});

// 2. Registro de Diagnósticos y Consumo de Bodega (Desde App 1)
app.post('/api/mw/diagnosticos', async (req, res) => {
    const { id, rut, diagnostico, origen_registro } = req.body;
    console.log(`[MIDDLEWARE] Procesando diagnóstico para RUT: ${rut}`);

    if (!id || !rut || !diagnostico) {
        return res.status(400).json({ error: 'Campos id, rut y diagnostico son requeridos.' });
    }

    const payload = { id, rut, diagnostico, origen: origen_registro || 'desconocido' };

    // Intentar analizar recetas de medicamentos en el texto del diagnóstico
    let medicamentoEncontrado = null;
    let codigoInsumo = null;
    
    if (diagnostico.toLowerCase().includes('paracetamol')) {
        medicamentoEncontrado = 'Paracetamol 500mg';
        codigoInsumo = 'INS-001';
    } else if (diagnostico.toLowerCase().includes('ibuprofeno')) {
        medicamentoEncontrado = 'Ibuprofeno 600mg';
        codigoInsumo = 'INS-002';
    } else if (diagnostico.toLowerCase().includes('enalapril')) {
        medicamentoEncontrado = 'Enalapril 10mg';
        codigoInsumo = 'INS-003';
    }

    let client;
    try {
        client = new Client(pgCentralConfig);
        await client.connect();
        
        // Guardar diagnóstico en base central de auditoría
        await client.query(
            'INSERT INTO auditoria_diagnosticos (id, rut, diagnostico, origen) VALUES ($1, $2, $3, $4)',
            [payload.id, payload.rut, payload.diagnostico, payload.origen]
        );
        console.log(`[MIDDLEWARE] Sincronización inmediata en DB Central (Diagnóstico ID: ${id})`);

        // Si hay un medicamento recetado, invocar al servicio de Bodega
        if (codigoInsumo) {
            console.log(`[MIDDLEWARE] Receta identificada: ${medicamentoEncontrado}. Solicitando descuento en bodega...`);
            try {
                const response = await axios.post(`${BODEGA_APP_URL}/api/inventario/descontar`, {
                    codigo: codigoInsumo,
                    cantidad: 1
                });
                console.log(`[MIDDLEWARE] Descuento exitoso. Respuesta Bodega:`, response.data);
            } catch (errBodega) {
                console.error(`[MIDDLEWARE_ERROR] Error al notificar a bodega: ${errBodega.message}. Encolando consumo.`);
                await encolarContingencia('DESCONTAR_BODEGA', { codigo: codigoInsumo, cantidad: 1 });
            }
        }

        res.json({ status: 'OK', message: 'Diagnóstico registrado centralmente.' });
    } catch (err) {
        console.error('[MIDDLEWARE_ERROR] Base central no responde. Guardando diagnóstico en contingencia:', err.message);
        await encolarContingencia('GUARDAR_DIAGNOSTICO', payload);
        
        // Si además tenía un insumo recetado, lo encolamos para procesarlo después
        if (codigoInsumo) {
            await encolarContingencia('DESCONTAR_BODEGA', { codigo: codigoInsumo, cantidad: 1 });
        }

        res.json({ status: 'PENDING', message: 'Base central fuera de línea. Registro encolado.' });
    } finally {
        if (client) await client.end();
    }
});

// 3. Endpoint de estado y cola para el frontend
app.get('/api/mw/status', async (req, res) => {
    try {
        const resDb = await contingenciaPool.query('SELECT COUNT(*) as count FROM cola_contingencia');
        res.json({ status: 'OK', queueSize: parseInt(resDb.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ------------------------------------------------------------------------------
// Hilo Sincronizador de Contingencia (Corre cada 10 segundos)
// ------------------------------------------------------------------------------
async function procesarColaContingencia() {
    try {
        const resDb = await contingenciaPool.query('SELECT * FROM cola_contingencia WHERE intentos < 10 ORDER BY id ASC LIMIT 5');
        const rows = resDb.rows;

        if (!rows || rows.length === 0) return;

        console.log(`[SINCRONIZADOR] Procesando ${rows.length} elementos pendientes en cola de contingencia...`);

        let client;
        try {
            client = new Client(pgCentralConfig);
            await client.connect();
            
            for (const row of rows) {
                const payload = JSON.parse(row.payload);
                console.log(`[SINCRONIZADOR] Sincronizando elemento ID ${row.id} de tipo ${row.tipo}`);
                
                try {
                    if (row.tipo === 'ADMITIR_PACIENTE') {
                        await client.query(
                            'INSERT INTO registro_admisiones (id, rut, nombre, origen) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                            [payload.id, payload.rut, payload.nombre, payload.origen]
                        );
                    } else if (row.tipo === 'GUARDAR_DIAGNOSTICO') {
                        await client.query(
                            'INSERT INTO auditoria_diagnosticos (id, rut, diagnostico, origen) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                            [payload.id, payload.rut, payload.diagnostico, payload.origen]
                        );
                    } else if (row.tipo === 'DESCONTAR_BODEGA') {
                        // Intentar enviar el descuento a la App 3 de Bodega
                        await axios.post(`${BODEGA_APP_URL}/api/inventario/descontar`, {
                            codigo: payload.codigo,
                            cantidad: payload.cantidad
                        });
                    } else if (row.tipo === 'SINCRONIZAR_HOSPITAL') {
                        await axios.post(`${HOSPITAL_APP_URL}/api/pacientes/sincronizar`, {
                            id: payload.id,
                            rut: payload.rut,
                            nombre: payload.nombre,
                            diagnostico: payload.diagnostico,
                            origen_registro: payload.origen
                        });
                    }

                    // Eliminar si fue procesado con éxito
                    await contingenciaPool.query('DELETE FROM cola_contingencia WHERE id = $1', [row.id]);
                    console.log(`[SINCRONIZADOR] Elemento ID ${row.id} sincronizado y eliminado de la cola.`);
                } catch (errEl) {
                    console.error(`[SINCRONIZADOR_ERROR] Error procesando elemento ID ${row.id}: ${errEl.message}`);
                    await contingenciaPool.query('UPDATE cola_contingencia SET intentos = intentos + 1 WHERE id = $1', [row.id]);
                }
            }
        } catch (errConn) {
            console.error('[SINCRONIZADOR] Imposible reconectar a la base central de datos:', errConn.message);
        } finally {
            if (client) await client.end();
        }
    } catch (err) {
        console.error('[SINCRONIZADOR] Error consultando la cola de contingencia:', err.message);
    }
}

// Iniciar worker de fondo
setInterval(procesarColaContingencia, 10000);

app.listen(PORT, () => {
    console.log(`[SISTEMA] Middleware operativo en puerto ${PORT} (Sincronizador activo cada 10s)`);
});
