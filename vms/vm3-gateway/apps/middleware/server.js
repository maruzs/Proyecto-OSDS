const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8000;

// Configuración de MySQL Central (a través del proxy)
const mysqlConfig = {
    host: process.env.DB_CENTRAL_HOST || 'db-central-proxy',
    port: parseInt(process.env.DB_CENTRAL_PORT || '3306'),
    user: process.env.DB_CENTRAL_USER || 'clinica_user',
    password: process.env.DB_CENTRAL_PASSWORD || 'clinica_secure_pass',
    database: process.env.DB_CENTRAL_NAME || 'clinica_central',
    connectTimeout: 5000
};

// URL de la App de Bodega
const BODEGA_APP_URL = process.env.BODEGA_APP_URL || 'http://app-bodega:8003';

// ------------------------------------------------------------------------------
# Base de datos SQLite de contingencia (Local en VM3)
// ------------------------------------------------------------------------------
const dbPath = path.join(__dirname, 'contingencia.db');
const contingenciaDb = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('[SQLITE] Error abriendo base de contingencia:', err);
    else console.log('[SQLITE] Conectado a contingencia.db local.');
});

contingenciaDb.serialize(() => {
    contingenciaDb.run(`
        CREATE TABLE IF NOT EXISTS cola_contingencia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo VARCHAR(50) NOT NULL,
            payload TEXT NOT NULL,
            intentos INTEGER DEFAULT 0,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Helper para insertar en contingencia
function encolarContingencia(tipo, payload) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO cola_contingencia (tipo, payload) VALUES (?, ?)';
        contingenciaDb.run(sql, [tipo, JSON.stringify(payload)], function(err) {
            if (err) {
                console.error('[SQLITE] Error al encolar:', err);
                reject(err);
            } else {
                console.log(`[SQLITE] Sincronización diferida encolada. ID: ${this.lastID}`);
                resolve(this.lastID);
            }
        });
    });
}

// ------------------------------------------------------------------------------
# Endpoints del Middleware
// ------------------------------------------------------------------------------

// 1. Registro de Pacientes (Consolidación desde App 2)
app.post('/api/mw/pacientes', async (req, res) => {
    const { id, rut, nombre, origen_registro } = req.body;
    console.log(`[MIDDLEWARE] Procesando admisión del paciente: ${nombre} (${rut})`);

    if (!id || !rut || !nombre) {
        return res.status(400).json({ error: 'Campos id, rut y nombre son requeridos.' });
    }

    const payload = { id, rut, nombre, origen: origen_registro || 'desconocido' };

    let connection;
    try {
        connection = await mysql.createConnection(mysqlConfig);
        await connection.execute(
            'INSERT INTO registro_admisiones (id, rut, nombre, origen) VALUES (?, ?, ?, ?)',
            [payload.id, payload.rut, payload.nombre, payload.origen]
        );
        console.log(`[MIDDLEWARE] Sincronización inmediata en DB Central (Paciente ID: ${id})`);
        res.json({ status: 'OK', message: 'Paciente guardado en base de datos central.' });
    } catch (err) {
        console.error('[MIDDLEWARE_ERROR] Base de datos central no responde. Guardando en contingencia:', err.message);
        await encolarContingencia('ADMITIR_PACIENTE', payload);
        res.json({ status: 'PENDING', message: 'Base central fuera de línea. Admisión registrada en cola de contingencia.' });
    } finally {
        if (connection) await connection.end();
    }
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

    let connection;
    try {
        connection = await mysql.createConnection(mysqlConfig);
        
        // Guardar diagnóstico en base central de auditoría
        await connection.execute(
            'INSERT INTO auditoria_diagnosticos (id, rut, diagnostico, origen) VALUES (?, ?, ?, ?)',
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
        if (connection) await connection.end();
    }
});

// ------------------------------------------------------------------------------
# Hilo Sincronizador de Contingencia (Corre cada 10 segundos)
// ------------------------------------------------------------------------------
async function procesarColaContingencia() {
    contingenciaDb.all('SELECT * FROM cola_contingencia ORDER BY id ASC LIMIT 5', async (err, rows) => {
        if (err || !rows || rows.length === 0) return;

        console.log(`[SINCRONIZADOR] Procesando ${rows.length} elementos pendientes en cola de contingencia...`);

        let connection;
        try {
            connection = await mysql.createConnection(mysqlConfig);
            
            for (const row of rows) {
                const payload = JSON.parse(row.payload);
                console.log(`[SINCRONIZADOR] Sincronizando elemento ID ${row.id} de tipo ${row.tipo}`);
                
                try {
                    if (row.tipo === 'ADMITIR_PACIENTE') {
                        await connection.execute(
                            'INSERT INTO registro_admisiones (id, rut, nombre, origen) VALUES (?, ?, ?, ?)',
                            [payload.id, payload.rut, payload.nombre, payload.origen]
                        );
                    } else if (row.tipo === 'GUARDAR_DIAGNOSTICO') {
                        await connection.execute(
                            'INSERT INTO auditoria_diagnosticos (id, rut, diagnostico, origen) VALUES (?, ?, ?, ?)',
                            [payload.id, payload.rut, payload.diagnostico, payload.origen]
                        );
                    } else if (row.tipo === 'DESCONTAR_BODEGA') {
                        // Intentar enviar el descuento a la App 3 de Bodega
                        await axios.post(`${BODEGA_APP_URL}/api/inventario/descontar`, {
                            codigo: payload.codigo,
                            cantidad: payload.cantidad
                        });
                    }

                    // Eliminar si fue procesado con éxito
                    contingenciaDb.run('DELETE FROM cola_contingencia WHERE id = ?', [row.id]);
                    console.log(`[SINCRONIZADOR] Elemento ID ${row.id} sincronizado y eliminado de la cola.`);
                } catch (errEl) {
                    console.error(`[SINCRONIZADOR_ERROR] Error procesando elemento ID ${row.id}: ${errEl.message}`);
                    contingenciaDb.run('UPDATE cola_contingencia SET intentos = intentos + 1 WHERE id = ?', [row.id]);
                }
            }
        } catch (errConn) {
            console.error('[SINCRONIZADOR] Imposible reconectar a la base central de datos:', errConn.message);
        } finally {
            if (connection) await connection.end();
        }
    });
}

// Iniciar worker de fondo
setInterval(procesarColaContingencia, 10000);

app.listen(PORT, () => {
    console.log(`[SISTEMA] Middleware operativo en puerto ${PORT} (Sincronizador activo cada 10s)`);
});
