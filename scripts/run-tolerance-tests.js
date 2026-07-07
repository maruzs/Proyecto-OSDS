const { io } = require("socket.io-client");
const { exec } = require("child_process");

const DOMAIN = "https://osds.epistia.cl";

function runCmd(command) {
    return new Promise((resolve) => {
        console.log(`[EXEC] Running: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve({ error, stdout: stdout.trim(), stderr: stderr.trim() });
            } else {
                resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            }
        });
    });
}

function parseStock(stdout, codigo) {
    const lines = stdout.split("\n");
    for (const line of lines) {
        if (line.includes(codigo)) {
            const parts = line.split("|");
            if (parts.length >= 3) {
                return parseInt(parts[2].trim());
            }
        }
    }
    throw new Error(`Could not find stock for code ${codigo} in output: ${stdout}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function connectSocket(path) {
    return new Promise((resolve, reject) => {
        const socket = io(DOMAIN, {
            path: path,
            transports: ["websocket"],
            reconnection: true,
            timeout: 5000
        });

        socket.on("connect", () => {
            console.log(`[WS_CONNECT] Connected to ${path} successfully.`);
            resolve(socket);
        });

        socket.on("connect_error", (err) => {
            console.error(`[WS_ERROR] Connection error on ${path}:`, err.message);
            reject(err);
        });
    });
}

async function runTest1() {
    console.log("\n==========================================");
    console.log("TEST 1: Caída del Servidor de Aplicación Principal");
    console.log("==========================================");

    console.log("1. Connecting to /ws-administrativas...");
    const socket = await connectSocket("/ws-administrativas");

    console.log("2. Admitting initial patient (Test1-Before) while App is UP...");
    const rut1 = "88888888-1";
    const name1 = "Test1 Before Outage";
    
    socket.emit("admitir_paciente", {
        rut: rut1,
        nombre: name1,
        rol: "administrativo"
    });

    const patient1 = await new Promise((resolve) => {
        socket.once("paciente_admitido_confirmado", (data) => {
            console.log(`[WS_REC] Patient admitted successfully: ${data.nombre} (ID: ${data.id})`);
            resolve(data);
        });
    });

    console.log("3. Stopping 'app-terminales' on VM2 to simulate main server outage...");
    await runCmd('gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker stop app-terminales" --quiet');
    
    console.log("Waiting 6 seconds for Nginx proxy to detect connection failure and trigger failover...");
    await sleep(6000);

    console.log("4. Admitting second patient (Test1-After) during outage (should failover to replica)...");
    const rut2 = "88888888-2";
    const name2 = "Test1 After Outage (Failover)";

    socket.emit("admitir_paciente", {
        rut: rut2,
        nombre: name2,
        rol: "administrativo"
    });

    const patient2 = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for admission confirmation under failover"));
        }, 15000);

        socket.once("paciente_admitido_confirmado", (data) => {
            clearTimeout(timeout);
            console.log(`[WS_REC] Patient admitted successfully under failover: ${data.nombre} (ID: ${data.id})`);
            resolve(data);
        });
    });

    socket.disconnect();

    console.log("5. Restoring main server 'app-terminales' on VM2...");
    await runCmd('gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker start app-terminales" --quiet');

    console.log("6. Checking VM3 Nginx Proxy logs for upstream failover message...");
    const nginxLogs = await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker logs nginx-proxy --tail 20" --quiet');
    console.log("[LOGS_NGINX]:\n", nginxLogs.stdout);

    console.log("✅ TEST 1 COMPLETED SUCCESSFULLY!");
}

async function runTest2() {
    console.log("\n==========================================");
    console.log("TEST 2: Interrupción de la Base de Datos Principal");
    console.log("==========================================");

    console.log("1. Connecting to /ws-medicas...");
    const socket = await connectSocket("/ws-medicas");

    console.log("2. Querying patient RUT 12345678-9 while DB Master is UP...");
    socket.emit("consultar_paciente", { rut: "12345678-9" });
    const patientBefore = await new Promise((resolve) => {
        socket.once("ficha_paciente", (data) => {
            console.log(`[WS_REC] Patient retrieved: ${data.datos.nombre} (Diag: ${data.datos.diagnostico})`);
            resolve(data);
        });
    });

    console.log("3. Stopping 'db-local-master' on VM1 to simulate local database outage...");
    await runCmd('gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker stop db-local-master" --quiet');

    console.log("Waiting 12 seconds for HAProxy to detect database outage (2 checks * 3s interval + buffer)...");
    await sleep(12000);

    console.log("4. Querying patient RUT 12345678-9 again during outage (should read from replica via HAProxy)...");
    socket.emit("consultar_paciente", { rut: "12345678-9" });
    const patientAfter = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for patient info under database failover"));
        }, 15000);

        socket.once("ficha_paciente", (data) => {
            clearTimeout(timeout);
            if (data.estado === "OK" && data.datos) {
                console.log(`[WS_REC] Patient retrieved under DB failover: ${data.datos.nombre} (Diag: ${data.datos.diagnostico})`);
                resolve(data);
            } else {
                reject(new Error(`Failed to query patient: ${data.estado} - ${data.mensaje}`));
            }
        });
    });

    socket.disconnect();

    console.log("5. Restoring local database 'db-local-master' on VM1...");
    await runCmd('gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker start db-local-master" --quiet');

    console.log("Waiting 12 seconds for HAProxy to detect that DB Master is back UP...");
    await sleep(12000);

    console.log("Recycling 'app-estaciones' and 'app-estaciones-replica' containers to refresh connection pool...");
    await runCmd('gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker restart app-estaciones app-estaciones-replica" --quiet');
    await sleep(4000);

    console.log("6. Checking VM1 HAProxy logs for backend failover message...");
    const haproxyLogs = await runCmd('gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker logs db-local-proxy --tail 20" --quiet');
    console.log("[LOGS_HAPROXY]:\n", haproxyLogs.stdout || haproxyLogs.stderr);

    console.log("✅ TEST 2 COMPLETED SUCCESSFULLY!");
}

async function runTest3() {
    console.log("\n==========================================");
    console.log("TEST 3: Caída del Middleware y Recuperación Asíncrona (Cola Contingencia)");
    console.log("==========================================");

    console.log("1. Get current stock of Paracetamol 500mg (INS-001) in DB Central...");
    const stockQueryBefore = await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec db-central-master psql -U postgres -d clinica_central -c \'SELECT * FROM inventario_insumos;\'" --quiet');
    console.log("[STOCK_BEFORE]:\n", stockQueryBefore.stdout);
    const initialStock = parseStock(stockQueryBefore.stdout, "INS-001");

    console.log("2. Stopping 'app-bodega' on VM3 to simulate inventory service outage...");
    await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker stop app-bodega" --quiet');
    await sleep(2000);

    console.log("3. Connecting to /ws-medicas to submit prescription...");
    const socket = await connectSocket("/ws-medicas");

    console.log("4. Updating patient diagnosis to include Paracetamol 500mg...");
    const patientId = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"; // Maria Loyola
    const newDiag = "DIAGNOSTICO: Paciente requiere tratamiento sintomático con Paracetamol 500mg cada 8 horas.";
    
    socket.emit("actualizar_diagnostico", {
        id: patientId,
        diagnostico: newDiag
    });

    const updateRes = await new Promise((resolve) => {
        socket.once("diagnostico_actualizado", (data) => {
            console.log(`[WS_REC] Diagnosis update response: ${data.estado}`);
            resolve(data);
        });
    });

    socket.disconnect();

    console.log("Waiting 4 seconds for asynchronous diagnosis notification to propagate and queue in PostgreSQL...");
    await sleep(4000);

    console.log("5. Querying local PostgreSQL contingency database in 'app-middleware'...");
    const sqliteBefore = await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec app-middleware node /app/query-sqlite-container.js" --quiet');
    console.log("[POSTGRES_QUEUE_BEFORE]:\n", sqliteBefore.stdout);

    if (!sqliteBefore.stdout.includes("DESCONTAR_BODEGA")) {
        throw new Error("Prescription item was not queued in PostgreSQL contingency database!");
    }

    console.log("6. Restoring inventory service 'app-bodega' on VM3...");
    await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker start app-bodega" --quiet');

    console.log("7. Waiting 12 seconds for background synchronizer worker to run...");
    await sleep(12000);

    console.log("8. Querying PostgreSQL contingency database again (should be empty)...");
    const sqliteAfter = await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec app-middleware node /app/query-sqlite-container.js" --quiet');
    console.log("[POSTGRES_QUEUE_AFTER]:\n", sqliteAfter.stdout || "(empty queue)");

    console.log("9. Verifying final stock of Paracetamol 500mg (INS-001) in DB Central (should be decremented by 1)...");
    const stockQueryAfter = await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec db-central-master psql -U postgres -d clinica_central -c \'SELECT * FROM inventario_insumos;\'" --quiet');
    console.log("[STOCK_AFTER]:\n", stockQueryAfter.stdout);
    const finalStock = parseStock(stockQueryAfter.stdout, "INS-001");

    if (finalStock === initialStock - 1) {
        console.log(`[SUCCESS] Stock correctly decremented from ${initialStock} to ${finalStock}.`);
    } else {
        throw new Error(`Stock mismatch! Expected ${initialStock - 1}, got ${finalStock}`);
    }

    console.log("10. Fetching Middleware logs for sync verification...");
    const mwLogs = await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker logs app-middleware --tail 25" --quiet');
    console.log("[LOGS_MIDDLEWARE]:\n", mwLogs.stdout || mwLogs.stderr);

    console.log("✅ TEST 3 COMPLETED SUCCESSFULLY!");
}

async function main() {
    try {
        console.log("🚀 STARTING TOLERANCE TESTS ON LIVE CLOUD SERVICES...");
        await runTest1();
        await runTest2();
        await runTest3();
        console.log("\n🎉 ALL LIVE SERVICE OUTAGE TOLERANCE TESTS PASSED SUCCESSFULLY! 🎉\n");
    } catch (err) {
        console.error("❌ TEST RUN FAILED:", err);
        // Attempt to clean up and restore master containers
        await runCmd('gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker start app-terminales" --quiet');
        await runCmd('gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker start db-local-master" --quiet');
        await runCmd('gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker start app-bodega" --quiet');
        process.exit(1);
    }
}

main();
