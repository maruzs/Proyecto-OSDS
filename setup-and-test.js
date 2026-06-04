const { io } = require("socket.io-client");
const { exec } = require("child_process");

const COMPOSE_FILE = "C:/Users/Administrator/Desktop/Proyecto-OSDS/docker-compose.yml";

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
    await runCmd(`docker compose -f ${COMPOSE_FILE} down -v`);
    await runCmd(`docker compose -f ${COMPOSE_FILE} up --build -d`);

    console.log("⏱️ Waiting 12 seconds for containers and databases to initialize...");
    await sleep(12000);

    console.log("=== STEP 2: Setting up and verifying logical replication (Option B - origin = none) ===");
    
    // Check/create publications and subscriptions on db-nube
    console.log("Setting up db-nube publications and subscriptions...");
    await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "DROP SUBSCRIPTION IF EXISTS sub_desde_local;"`);
    await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "DROP PUBLICATION IF EXISTS pub_nube_a_local;"`);
    await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes;"`);

    // Check/create publications and subscriptions on db-local
    console.log("Setting up db-local publications and subscriptions...");
    await runCmd(`docker exec db-local psql -U postgres -d clinica -c "DROP SUBSCRIPTION IF EXISTS sub_desde_nube;"`);
    await runCmd(`docker exec db-local psql -U postgres -d clinica -c "DROP PUBLICATION IF EXISTS pub_local_a_nube;"`);
    await runCmd(`docker exec db-local psql -U postgres -d clinica -c "CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes;"`);

    // Create subscriptions with origin = none
    console.log("Creating subscription sub_desde_local on db-nube...");
    await runCmd(
        `docker exec db-nube psql -U postgres -d clinica -c ` +
        `"CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false, origin = none);"`
    );

    console.log("Creating subscription sub_desde_nube on db-local...");
    await runCmd(
        `docker exec db-local psql -U postgres -d clinica -c ` +
        `"CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=db-nube port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false, origin = none);"`
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
        path: "/ws-medicas",
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
        console.error("❌ FAILURE: Nginx proxying failed or has path mismatch.");
        process.exit(1);
    }

    console.log("\n=== STEP 4: Running End-to-End WebSocket & Replication Test ===");
    
    // We will do this test using port 80 (nginx-proxy) since we verified Nginx proxying works!
    const patientRut = "77777777-7";
    const patientName = "Clara Campo";

    const socketTerminalesDirect = io("http://localhost:80", {
        path: "/ws-administrativas",
        transports: ["websocket"]
    });

    socketTerminalesDirect.on("connect", () => {
        console.log("🔌 Connected to app-terminales via Nginx Proxy");
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
        const socketMedicasDirect = io("http://localhost:80", {
            path: "/ws-medicas",
            transports: ["websocket"]
        });

        socketMedicasDirect.on("connect", () => {
            console.log("🔌 Connected to app-estaciones via Nginx Proxy");
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
            console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! BOTH SERVICES, NGINX PROXY AND BIDIRECTIONAL REPLICATION WORK CORRECTLY!");
            process.exit(0);
        } else {
            console.error("❌ FAILURE: Updated diagnosis not found or mismatch in Cloud database:", diagnosis);
            process.exit(1);
        }
    }
}

main();
