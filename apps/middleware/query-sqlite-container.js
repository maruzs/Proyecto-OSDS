const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_CONTINGENCIA_HOST || 'db-contingencia',
    port: parseInt(process.env.DB_CONTINGENCIA_PORT || '5432'),
    user: process.env.DB_CONTINGENCIA_USER || 'postgres',
    password: process.env.DB_CONTINGENCIA_PASSWORD || 'postgres_secure_pass',
    database: process.env.DB_CONTINGENCIA_NAME || 'contingencia'
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM cola_contingencia');
        console.log(JSON.stringify(res.rows));
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
    }
}
run();
