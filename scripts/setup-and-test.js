const { io } = require("socket.io-client");
const { exec } = require("child_process");
const path = require("path");

const COMPOSE_FILE = path.join(__dirname, "../docker-compose.yml");

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
    console.log("=== STEP 1: Recreating docker containers ===");
    await runCmd(`docker compose -f ${COMPOSE_FILE} down -v`);
    await runCmd(`docker compose -f ${COMPOSE_FILE} up --build -d`);

    console.log("Waiting for containers to initialize...");
    await sleep(12000);

    console.log("=== STEP 2: Setting up replication ===");
    
    await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "DROP SUBSCRIPTION IF EXISTS sub_desde_local;"`);
    await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "DROP PUBLICATION IF EXISTS pub_nube_a_local;"`);
    await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes;"`);

    await runCmd(`docker exec db-local psql -U postgres -d clinica -c "DROP SUBSCRIPTION IF EXISTS sub_desde_nube;"`);
    await runCmd(`docker exec db-local psql -U postgres -d clinica -c "DROP PUBLICATION IF EXISTS pub_local_a_nube;"`);
    await runCmd(`docker exec db-local psql -U postgres -d clinica -c "CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes;"`);

    await runCmd(
        `docker exec db-nube psql -U postgres -d clinica -c ` +
        `"CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false, origin = none);"`
    );

    await runCmd(
        `docker exec db-local psql -U postgres -d clinica -c ` +
        `"CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=db-nube port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false, origin = none);"`
    );

    console.log("Verifying subscriptions on db-nube:");
    const resNube = await runCmd(`docker exec db-nube psql -U postgres -d clinica -c "SELECT subname, subenabled, subpublications FROM pg_subscription;"`);
    console.log(resNube.stdout);

    console.log("Verifying subscriptions on db-local:");
    const resLocal = await runCmd(`docker exec db-local psql -U postgres -d clinica -c "SELECT subname, subenabled, subpublications FROM pg_subscription;"`);
    console.log(resLocal.stdout);

    console.log("=== STEP 3: Testing WebSockets through Nginx Proxy ===");
    
    let medicasConnected = false;
    let terminalesConnected = false;

    const socketMedicas = io("http://localhost:80", {
        path: "/ws-medicas",
        transports: ["websocket"],
        timeout: 5000
    });

    socketMedicas.on("connect", () => {
        console.log("Connected to estaciones-medicas!");
        medicasConnected = true;
    });

    socketMedicas.on("connect_error", (err) => {
        console.error("Connection error on estaciones-medicas:", err.message);
    });

    const socketTerminales = io("http://localhost:80", {
        path: "/ws-administrativas",
        transports: ["websocket"],
        timeout: 5000
    });

    socketTerminales.on("connect", () => {
        console.log("Connected to terminales-administrativas!");
        terminalesConnected = true;
    });

    socketTerminales.on("connect_error", (err) => {
        console.error("Connection error on terminales-administrativas:", err.message);
    });

    await sleep(4000);

    socketMedicas.disconnect();
    socketTerminales.disconnect();

    if (medicasConnected && terminalesConnected) {
        console.log("SUCCESS: Nginx proxying works!");
    } else {
        console.error("FAILURE: Nginx proxying failed.");
        process.exit(1);
    }

    console.log("=== STEP 4: End-to-End WebSocket & Replication Test ===");
    
    const patientRut = "77777777-7";
    const patientName = "Clara Campo";

    const socketTerminalesDirect = io("http://localhost:80", {
        path: "/ws-administrativas",
        transports: ["websocket"]
    });

    socketTerminalesDirect.on("connect", () => {
        console.log("Connected to app-terminales");
        socketTerminalesDirect.emit("admitir_paciente", {
            rut: patientRut,
            nombre: patientName,
            diagnostico: "Ingreso inicial"
        });
    });

    socketTerminalesDirect.on("paciente_admitido_confirmado", (data) => {
        console.log("Admission confirmed in db-nube:", data);
        socketTerminalesDirect.disconnect();

        console.log("Waiting for logical replication to local db...");
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
            console.log("Connected to app-estaciones");
            socketMedicasDirect.emit("consultar_paciente", { rut: patientRut });
        });

        socketMedicasDirect.on("ficha_paciente", (data) => {
            console.log("Received ficha_paciente from db-local:", data);
            if (data.estado === "OK" && data.datos && data.datos.id === expectedId) {
                console.log("SUCCESS: Cloud patient replicated to local!");
                updateDiagnosisOnLocal(socketMedicasDirect, expectedId);
            } else {
                console.error("FAILURE: Patient not found on local db.");
                socketMedicasDirect.disconnect();
                process.exit(1);
            }
        });
    }

    function updateDiagnosisOnLocal(socketMedicasDirect, id) {
        const newDiagnosis = "DIAGNÓSTICO: Migraña tensional moderada. RECETA: Paracetamol 1g.";
        console.log("Updating diagnosis in db-local...");
        socketMedicasDirect.emit("actualizar_diagnostico", {
            id: id,
            diagnostico: newDiagnosis
        });

        socketMedicasDirect.on("diagnostico_actualizado", (data) => {
            console.log("Received diagnostico_actualizado from db-local:", data);
            if (data.estado === "OK" && data.datos.diagnostico === newDiagnosis) {
                console.log("Diagnosis updated on db-local!");
                socketMedicasDirect.disconnect();

                console.log("Waiting for replication to sync to db-nube...");
                setTimeout(() => {
                    verifyDiagnosisOnCloud(id, newDiagnosis);
                }, 3000);
            } else {
                console.error("FAILURE: Diagnosis update failed on local db.");
                socketMedicasDirect.disconnect();
                process.exit(1);
            }
        });
    }

    async function verifyDiagnosisOnCloud(id, expectedDiagnosis) {
        const res = await runCmd(`docker exec db-nube psql -U postgres -d clinica -t -c "SELECT diagnostico FROM fichas_pacientes WHERE id = '${id}';"`);
        const diagnosis = res.stdout.trim();
        if (diagnosis.includes(expectedDiagnosis)) {
            console.log("SUCCESS: Diagnosis update replicated to cloud db!");
            console.log("ALL TESTS PASSED.");
            process.exit(0);
        } else {
            console.error("FAILURE: Updated diagnosis not found on cloud db.");
            process.exit(1);
        }
    }
}

main();
