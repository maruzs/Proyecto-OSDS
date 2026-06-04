const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    path: '/ws-administrativas',
    cors: { origin: "*" }
});

const pool = new Pool({
    host: process.env.DB_HOST || 'db-nube',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres_secure_pass',
    database: process.env.DB_NAME || 'clinica',
    port: 5432,
});

io.on('connection', (socket) => {
    console.log('Cliente conectado (nube):', socket.id);

    socket.on('admitir_paciente', async (data) => {
        const nuevaFicha = {
            id: uuidv4(),
            rut: data.rut,
            nombre: data.nombre,
            diagnostico: data.diagnostico || 'Ingreso Administrativo / En espera de atencion',
            origen_registro: 'nube'
        };

        try {
            const queryText = `
                INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const values = [nuevaFicha.id, nuevaFicha.rut, nuevaFicha.nombre, nuevaFicha.diagnostico, nuevaFicha.origen_registro];
            
            const res = await pool.query(queryText, values);
            io.emit('paciente_admitido_confirmado', res.rows[0]);
        } catch (err) {
            console.error('Error al insertar paciente en db-nube:', err.message);
            socket.emit('error_admision', { error: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado (nube)');
    });
});

const PORT = 8002;
server.listen(PORT, () => {
    console.log(`Servidor de Terminales Administrativas operativo en puerto ${PORT}`);
});