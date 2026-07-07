const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
    path: '/ws-medicas',
    cors: { origin: "*" }
});

const pool = new Pool({
    host: process.env.DB_HOST || 'db-local-proxy',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres_secure_pass',
    database: process.env.DB_NAME || 'clinica',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const PORT = 8001;

io.on('connection', (socket) => {
    console.log(`[CONEXIÓN] Cliente conectado. ID Socket: ${socket.id}`);

    socket.on('consultar_paciente', async (data) => {
        console.log(`[QUERY] Solicitud de consulta. RUT: ${data ? data.rut : 'undefined'}`);
        if (!data || !data.rut) {
            console.error('[ERROR] Datos insuficientes para consultar paciente');
            return socket.emit('ficha_paciente', { estado: 'ERROR', mensaje: 'RUT requerido' });
        }

        try {
            const resDb = await pool.query(
                'SELECT * FROM fichas_pacientes WHERE rut = $1',
                [data.rut]
            );
            const rows = resDb.rows;

            if (rows.length > 0) {
                console.log(`[OK] Paciente encontrado. RUT: ${data.rut}, ID: ${rows[0].id}`);
                socket.emit('ficha_paciente', { estado: 'OK', datos: rows[0] });
            } else {
                console.warn(`[NOT_FOUND] Paciente no encontrado. RUT: ${data.rut}`);
                socket.emit('ficha_paciente', { estado: 'NO_ENCONTRADO', datos: null });
            }
        } catch (err) {
            console.error(`[DB_ERROR] Error al consultar paciente con RUT ${data.rut}:`, err);
            socket.emit('ficha_paciente', { estado: 'ERROR', mensaje: err.message });
        }
    });

    socket.on('actualizar_diagnostico', async (data) => {
        console.log(`[UPDATE] Solicitud de actualizacion. ID: ${data ? data.id : 'undefined'}`);
        if (!data || !data.id || !data.diagnostico) {
            console.error('[ERROR] Datos insuficientes para actualizar diagnostico');
            return socket.emit('diagnostico_actualizado', { estado: 'ERROR', mensaje: 'ID y diagnostico requeridos' });
        }

        try {
            // En PostgreSQL, podemos usar RETURNING * para evitar hacer una segunda consulta
            const resDb = await pool.query(
                `UPDATE fichas_pacientes 
                 SET diagnostico = $1, fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
                [data.diagnostico, data.id]
            );
            const rows = resDb.rows;

            if (rows.length > 0) {
                console.log(`[OK] Diagnostico actualizado. ID: ${data.id}`);
                socket.emit('diagnostico_actualizado', { estado: 'OK', datos: rows[0] });

                // Notificar al Middleware (VM3)
                const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://10.128.0.30:8000/api/mw/diagnosticos';
                fetch(middlewareUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: rows[0].id,
                        rut: rows[0].rut,
                        diagnostico: rows[0].diagnostico,
                        origen_registro: rows[0].origen_registro
                    })
                }).then(res => res.json())
                  .then(mwRes => console.log('[MIDDLEWARE] Notificacion enviada:', mwRes))
                  .catch(errMw => console.error('[MIDDLEWARE_ERROR] Error al notificar:', errMw.message));
            } else {
                console.warn(`[NOT_FOUND] Ficha no encontrada para actualizar. ID: ${data.id}`);
                socket.emit('diagnostico_actualizado', { estado: 'NO_ENCONTRADO', datos: null });
            }
        } catch (err) {
            console.error(`[DB_ERROR] Error al actualizar diagnostico para ID ${data.id}:`, err);
            socket.emit('diagnostico_actualizado', { estado: 'ERROR', mensaje: err.message });
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`[DESCONEXIÓN] Cliente desconectado. ID Socket: ${socket.id}. Motivo: ${reason}`);
    });
});

// Endpoint HTTP para recibir sincronización de admisiones desde el Middleware (VM3)
app.post('/api/pacientes/sincronizar', async (req, res) => {
    const { id, rut, nombre, diagnostico, origen_registro } = req.body;
    console.log(`[SYNC] Solicitud de sincronización recibida del Middleware. RUT: ${rut}`);

    if (!id || !rut || !nombre) {
        return res.status(400).json({ error: 'Campos id, rut y nombre son requeridos.' });
    }

    try {
        await pool.query(
            `INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, diagnostico = EXCLUDED.diagnostico`,
            [id, rut, nombre, diagnostico || 'Ingreso Administrativo / En espera de atencion', origen_registro || 'nube']
        );
        console.log(`[SYNC] Paciente ${rut} sincronizado correctamente en PostgreSQL local.`);
        res.json({ status: 'OK', message: 'Paciente sincronizado en base de datos local.' });
    } catch (err) {
        console.error(`[SYNC_ERROR] Error al sincronizar paciente ${rut}:`, err.message);
        res.status(500).json({ status: 'ERROR', message: err.message });
    }
});

server.listen(PORT, () => {
    console.log(`[SISTEMA] Servidor Estaciones Medicas (PostgreSQL) operativo en puerto ${PORT}`);
});