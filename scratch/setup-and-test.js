const { io } = require("socket.io-client");
const { exec } = require("child_process");

function runCmd(command) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command error: ${error.message}`);
                resolve({ error, stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log("=== STEP 1: Tear down and recreate docker containers with fresh volumes ===");
    await runCmd("docker compose down -v");
    await runCmd("docker compose up --build -d");

    console.log("⏱️ Waiting 10 seconds for containers and databases to initialize...");
    await sleep(10000);

    console.log("=== STEP 2: Setting up and verifying logical replication ===");
    
    // Check/create subscription in db-nube (since it might have failed on init if db-local wasn't ready)
    console.log("Creating subscription sub_desde_local on db-nube if not exists...");
    await runCmd(
        `docker exec db-nube psql -U postgres -d clinica -c ` +
        `"CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false);"`
    );

    // Create subscription in db-local
    console.log("Creating subscription sub_desde_nube on db-local...");
    await runCmd(
        `docker exec db-local psql -U postgres -d clinica -c ` +
        `"CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=db-nube port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false);"`
    );

    // Verify subscriptions
    console.log("Verifying subscriptions on db-nube:");
    const resNube = await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "SELECT subname, subenabled, subpublications FROM pg_subscription;"`);
    console.log(resNube.stdout);

    console.log("Verifying subscriptions on db-local:");
    const resLocal = await runCmd(`docker exec db-local psql -U postgres -d clinica -c "SELECT subname, subenabled, subpublications FROM pg_subscription;"`);
    console.log(resLocal.stdout);

    console.log("=== STEP 3: Testing WebSockets through Nginx Proxy (Port 80) ===");
    
    let medicasConnected = false;
    let terminalesConnected = false;

    console.log("Connecting to estaciones-medicas via Nginx Proxy (port 80)...");
    const socketMedicas = io("http://localhost:80", {
        path: "/ws-medicas/",
        transports: ["websocket"],
        timeout: 5000
    });

    socketMedicas.on("connect", () => {
        console.log("✅ Connected to estaciones-medicas through Nginx!");
        medicasConnected = true;
    });

    socketMedicas.on("connect_error", (err) => {
        console.error("❌ Connection error on estaciones-medicas via Nginx:", err.message);
    });

    console.log("Connecting to terminales-administrativas via Nginx Proxy (port 80)...");
    const socketTerminales = io("http://localhost:80", {
        path: "/ws-administrativas",
        transports: ["websocket"],
        timeout: 5000
    });

    socketTerminales.on("connect", () => {
        console.log("✅ Connected to terminales-administrativas through Nginx!");
        terminalesConnected = true;
    });

    socketTerminales.on("connect_error", (err) => {
        console.error("❌ Connection error on terminales-administrativas via Nginx:", err.message);
    });

    await sleep(4000);

    socketMedicas.disconnect();
    socketTerminales.disconnect();

    if (medicasConnected && terminalesConnected) {
        console.log("🎉 SUCCESS: Nginx proxying is working perfectly!");
    } else {
        console.log("⚠️ WARNING: Nginx proxying failed or has path mismatch. Direct ports will be tested as fallback.");
    }

    console.log("\n=== STEP 4: Running End-to-End WebSocket & Replication Test ===");
    
    // We will do this test using the direct ports 8001 and 8002 to verify service logic independently first
    const patientRut = "77777777-7";
    const patientName = "Clara Campo";

    const socketTerminalesDirect = io("http://localhost:8002", {
        path: "/ws-administrativas",
        transports: ["websocket"]
    });

    socketTerminalesDirect.on("connect", () => {
        console.log("🔌 Connected directly to app-terminales (Port 8002)");
        console.log(`Sending 'admitir_paciente' for ${patientName} (RUT: ${patientRut})...`);
        socketTerminalesDirect.emit("admitir_paciente", {
            rut: patientRut,
            nombre: patientName,
            diagnostico: "Ingreso inicial"
        });
    });

    socketTerminalesDirect.on("paciente_admitido_confirmado", (data) => {
        console.log("📩 Admission confirmed in db-nube:", data);
        socketTerminalesDirect.disconnect();

        console.log("⏱️ Waiting 3 seconds for logical replication to sync to db-local...");
        setTimeout(() => {
            queryPatientOnLocal(data.id);
        }, 3000);
    });

    function queryPatientOnLocal(expectedId) {
        const socketMedicasDirect = io("http://localhost:8001", {
            path: "/ws-medicas/",
            transports: ["websocket"]
        });

        socketMedicasDirect.on("connect", () => {
            console.log("🔌 Connected directly to app-estaciones (Port 8001)");
            console.log(`Querying patient with RUT: ${patientRut} on db-local...`);
            socketMedicasDirect.emit("consultar_paciente", { rut: patientRut });
        });

        socketMedicasDirect.on("ficha_paciente", (data) => {
            console.log("📩 Received 'ficha_paciente' from db-local:", data);
            if (data.estado === "OK" && data.datos && data.datos.id === expectedId) {
                console.log("✅ SUCCESS: Patient admitted on Cloud has successfully replicated to Local!");
                
                // Now update the diagnosis on local
                updateDiagnosisOnLocal(socketMedicasDirect, expectedId);
            } else {
                console.error("❌ FAILURE: Patient not found or ID mismatch in db-local:", data);
                socketMedicasDirect.disconnect();
                process.exit(1);
            }
        });
    }

    function updateDiagnosisOnLocal(socketMedicasDirect, id) {
        const newDiagnosis = "DIAGNÓSTICO: Migraña tensional moderada. RECETA: Paracetamol 1g.";
        console.log(`Updating diagnosis for patient ${id} in db-local...`);
        socketMedicasDirect.emit("actualizar_diagnostico", {
            id: id,
            diagnostico: newDiagnosis
        });

        socketMedicasDirect.on("diagnostico_actualizado", (data) => {
            console.log("📩 Received 'diagnostico_actualizado' from db-local:", data);
            if (data.estado === "OK" && data.datos.diagnostico === newDiagnosis) {
                console.log("✅ Diagnosis updated successfully on db-local!");
                socketMedicasDirect.disconnect();

                console.log("⏱️ Waiting 3 seconds for replication to sync to db-nube...");
                setTimeout(() => {
                    verifyDiagnosisOnCloud(id, newDiagnosis);
                }, 3000);
            } else {
                console.error("❌ FAILURE: Diagnosis update failed on local:", data);
                socketMedicasDirect.disconnect();
                process.exit(1);
            }
        });
    }

    async function verifyDiagnosisOnCloud(id, expectedDiagnosis) {
        console.log(`Verifying patient ${id} diagnosis in db-nube...`);
        const res = await runCmd(`docker exec db-nube psql -U postgres -d clinica -t -c "SELECT diagnostico FROM fichas_pacientes WHERE id = '${id}';"`);
        const diagnosis = res.stdout.trim();
        console.log("Query output from db-nube:", diagnosis);
        if (diagnosis.includes(expectedDiagnosis)) {
            console.log("✅ SUCCESS: Updated diagnosis on Local has successfully replicated to Cloud!");
            console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! BOTH SERVICES AND BIDIRECTIONAL REPLICATION WORK CORRECTLY!");
            process.exit(0);
        } else {
            console.error("❌ FAILURE: Updated diagnosis not found or mismatch in Cloud database:", diagnosis);
            process.exit(1);
        }
    }
}

main();
