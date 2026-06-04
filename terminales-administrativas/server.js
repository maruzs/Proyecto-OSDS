const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io alineada con la ruta que espera Nginx
const io = new Server(server, {
    path: '/ws-administrativas',
    cors: { origin: "*" }
});

// Configuración de la base de datos (Lee variables de entorno automáticas de pg)
const pool = new Pool({
    host: process.env.DB_HOST || 'db-nube',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'centro_salud',
    port: 5432,
});

io.on('connection', (socket) => {
    console.log('⚡ Terminal Administrativa Conectada (ID Nube):', socket.id);

    // Evento de Admisión: Cuando el Integrante 4 (Frontend) envíe un paciente
    socket.on('admitir_paciente', async (data) => {
        console.log('💼 Procesando admisión en la Nube:', data);
        
        const nuevaFicha = {
            id: uuidv4(),
            rut: data.rut,
            nombre: data.nombre,
            diagnostico: data.diagnostico || 'Ingreso Administrativo / En espera de atención',
            origen_registro: 'nube' // CRUCIAL: Activa el filtro de PG15 para replicar a local
        };

        try {
            const queryText = `
                INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const values = [nuevaFicha.id, nuevaFicha.rut, nuevaFicha.nombre, nuevaFicha.diagnostico, nuevaFicha.origen_registro];
            
            const res = await pool.query(queryText, values);
            console.log('💾 Registro histórico guardado en db-nube:', res.rows[0]);

            // Emitir de vuelta a las terminales administrativas la confirmación
            io.emit('paciente_admitido_confirmado', res.rows[0]);
            
        } catch (err) {
            console.error('❌ Error guardando admisión en db-nube:', err.message);
            socket.emit('error_admision', { error: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Terminal Administrativa desconectada de la Nube');
    });
});

const PORT = 8002; // Puerto asignado por el DevOps en nginx.conf
server.listen(PORT, () => {
    console.log(`🚀 Servidor de Terminales Administrativas operativo en puerto ${PORT}`);
});