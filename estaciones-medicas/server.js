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

const PORT = 8001;

io.on('connection', (socket) => {
    console.log('⚡ Estación Médica Conectada (ID):', socket.id);

    // Evento 1: Consultar ficha por RUT
    socket.on('consultar_paciente', async (data) => {
        console.log('🔍 Consultando ficha del paciente RUT:', data.rut);

        try {
            const res = await pool.query(
                'SELECT * FROM fichas_pacientes WHERE rut = $1',
                [data.rut]
            );

            if (res.rows.length > 0) {
                socket.emit('ficha_paciente', { estado: 'OK', datos: res.rows[0] });
            } else {
                socket.emit('ficha_paciente', { estado: 'NO_ENCONTRADO', datos: null });
            }

        } catch (err) {
            console.error('❌ Error consultando db-local:', err.message);
            socket.emit('ficha_paciente', { estado: 'ERROR', mensaje: err.message });
        }
    });

    // Evento 2: Actualizar diagnóstico por UUID
    socket.on('actualizar_diagnostico', async (data) => {
        console.log('💾 Actualizando diagnóstico del paciente ID:', data.id);

        try {
            const res = await pool.query(
                `UPDATE fichas_pacientes 
                 SET diagnostico = $1, fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
                [data.diagnostico, data.id]
            );

            if (res.rows.length > 0) {
                socket.emit('diagnostico_actualizado', { estado: 'OK', datos: res.rows[0] });
            } else {
                socket.emit('diagnostico_actualizado', { estado: 'NO_ENCONTRADO', datos: null });
            }

        } catch (err) {
            console.error('❌ Error actualizando db-local:', err.message);
            socket.emit('diagnostico_actualizado', { estado: 'ERROR', mensaje: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Estación Médica desconectada');
    });
});

server.listen(PORT, () => {
    console.log(`🏥 Servidor Estaciones Médicas operativo en puerto ${PORT}`);
});