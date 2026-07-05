const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8003;

// Configuración de MySQL Central (vía proxy HAProxy)
const mysqlConfig = {
    host: process.env.DB_CENTRAL_HOST || 'db-central-proxy',
    port: parseInt(process.env.DB_CENTRAL_PORT || '3306'),
    user: process.env.DB_CENTRAL_USER || 'clinica_user',
    password: process.env.DB_CENTRAL_PASSWORD || 'clinica_secure_pass',
    database: process.env.DB_CENTRAL_NAME || 'clinica_central',
    connectTimeout: 5000
};

// Endpoint para obtener el stock de bodega
app.get('/api/inventario', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(mysqlConfig);
        const [rows] = await connection.execute('SELECT * FROM inventario_insumos');
        res.json({ status: 'OK', datos: rows });
    } catch (err) {
        console.error('[BODEGA_ERROR] Error obteniendo inventario:', err.message);
        res.status(500).json({ error: 'Base central fuera de línea.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Endpoint para descontar insumos clínicos por recetas
app.post('/api/inventario/descontar', async (req, res) => {
    const { codigo, cantidad } = req.body;
    console.log(`[BODEGA] Solicitud de descuento: Código ${codigo}, Cantidad ${cantidad}`);

    if (!codigo || !cantidad) {
        return res.status(400).json({ error: 'Campos codigo y cantidad son requeridos.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(mysqlConfig);
        
        // 1. Verificar si hay stock suficiente
        const [rows] = await connection.execute(
            'SELECT stock, nombre FROM inventario_insumos WHERE codigo = ?',
            [codigo]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }

        const stockActual = rows[0].stock;
        const nombreInsumo = rows[0].nombre;

        if (stockActual < cantidad) {
            console.warn(`[BODEGA_WARN] Stock insuficiente para ${nombreInsumo}. Solicitado: ${cantidad}, Disponible: ${stockActual}`);
            return res.status(400).json({ error: `Stock insuficiente para ${nombreInsumo}.` });
        }

        // 2. Realizar el descuento
        await connection.execute(
            'UPDATE inventario_insumos SET stock = stock - ? WHERE codigo = ?',
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
        if (connection) await connection.end();
    }
});

app.listen(PORT, () => {
    console.log(`[SISTEMA] Aplicación 3 (Sistema de Bodega) operativa en puerto ${PORT}`);
});
