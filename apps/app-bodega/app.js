const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8003;

// Configuración de PostgreSQL Central (vía proxy HAProxy)
const pgConfig = {
    host: process.env.DB_CENTRAL_HOST || 'db-central-proxy',
    port: parseInt(process.env.DB_CENTRAL_PORT || '5432'),
    user: process.env.DB_CENTRAL_USER || 'postgres',
    password: process.env.DB_CENTRAL_PASSWORD || 'postgres_secure_pass',
    database: process.env.DB_CENTRAL_NAME || 'clinica_central',
    connectionTimeoutMillis: 5000
};

// Endpoint para obtener el stock de bodega
app.get('/api/inventario', async (req, res) => {
    let client;
    try {
        client = new Client(pgConfig);
        await client.connect();
        const resDb = await client.query('SELECT * FROM inventario_insumos');
        res.json({ status: 'OK', datos: resDb.rows });
    } catch (err) {
        console.error('[BODEGA_ERROR] Error obteniendo inventario:', err.message);
        res.status(500).json({ error: 'Base central fuera de línea.' });
    } finally {
        if (client) await client.end();
    }
});

// Endpoint para descontar insumos clínicos por recetas
app.post('/api/inventario/descontar', async (req, res) => {
    const { codigo, cantidad } = req.body;
    console.log(`[BODEGA] Solicitud de descuento: Código ${codigo}, Cantidad ${cantidad}`);

    if (!codigo || !cantidad) {
        return res.status(400).json({ error: 'Campos codigo y cantidad son requeridos.' });
    }

    let client;
    try {
        client = new Client(pgConfig);
        await client.connect();
        
        // 1. Verificar si hay stock suficiente
        const resDb = await client.query(
            'SELECT stock, nombre FROM inventario_insumos WHERE codigo = $1',
            [codigo]
        );

        if (resDb.rows.length === 0) {
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }

        const stockActual = resDb.rows[0].stock;
        const nombreInsumo = resDb.rows[0].nombre;

        if (stockActual < cantidad) {
            console.warn(`[BODEGA_WARN] Stock insuficiente para ${nombreInsumo}. Solicitado: ${cantidad}, Disponible: ${stockActual}`);
            return res.status(400).json({ error: `Stock insuficiente para ${nombreInsumo}.` });
        }

        // 2. Realizar el descuento
        await client.query(
            'UPDATE inventario_insumos SET stock = stock - $1 WHERE codigo = $2',
            [cantidad, codigo]
        );

        console.log(`[BODEGA_OK] Descuento realizado. Insumo: ${nombreInsumo}. Nuevo stock: ${stockActual - cantidad}`);
        res.json({ 
            status: 'OK', 
            message: `Descontado ${cantidad} unidades de ${nombreInsumo}.`,
            nuevo_stock: stockActual - cantidad 
        });
    } catch (err) {
        console.error('[BODEGA_ERROR] Error de conexión con DB Central:', err.message);
        res.status(500).json({ error: 'Base central fuera de línea.' });
    } finally {
        if (client) await client.end();
    }
});

app.listen(PORT, () => {
    console.log(`[SISTEMA] Aplicación 3 (Sistema de Bodega) operativa en puerto ${PORT}`);
});
