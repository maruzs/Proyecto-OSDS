const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/app/contingencia.db');
db.all('SELECT * FROM cola_contingencia', (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows));
});
