const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    path: '/ws-medicas',
    cors: { origin: "*" }
});

const pool = new Pool({
    host: process.env.DB_HOST || 'db-local',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres_secure_pass',
    database: process.env.DB_NAME || 'clinica',
    port: 5432,
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de base de datos:', err);
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
            const res = await pool.query(
                'SELECT * FROM fichas_pacientes WHERE rut = $1',
                [data.rut]
            );

            if (res.rows.length > 0) {
                console.log(`[OK] Paciente encontrado. RUT: ${data.rut}, ID: ${res.rows[0].id}`);
                socket.emit('ficha_paciente', { estado: 'OK', datos: res.rows[0] });
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
            const res = await pool.query(
                `UPDATE fichas_pacientes 
                 SET diagnostico = $1, fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
                [data.diagnostico, data.id]
            );

            if (res.rows.length > 0) {
                console.log(`[OK] Diagnostico actualizado. ID: ${data.id}`);
                socket.emit('diagnostico_actualizado', { estado: 'OK', datos: res.rows[0] });
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

server.listen(PORT, () => {
    console.log(`[SISTEMA] Servidor Estaciones Medicas operativo en puerto ${PORT}`);
});