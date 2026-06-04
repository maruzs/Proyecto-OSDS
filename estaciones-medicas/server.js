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
    console.log('Cliente conectado:', socket.id);

    socket.on('consultar_paciente', async (data) => {
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
            console.error('Error al consultar paciente:', err.message);
            socket.emit('ficha_paciente', { estado: 'ERROR', mensaje: err.message });
        }
    });

    socket.on('actualizar_diagnostico', async (data) => {
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
            console.error('Error al actualizar diagnostico:', err.message);
            socket.emit('diagnostico_actualizado', { estado: 'ERROR', mensaje: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor Estaciones Medicas operativo en puerto ${PORT}`);
});