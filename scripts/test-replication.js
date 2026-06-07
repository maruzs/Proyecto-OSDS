const { io } = require("socket.io-client");

async function runEndToEndTest() {
    console.log("=== STARTING END-TO-END REPLICATION & WEBSOCKET TEST ===");

    const patientRut = "55555555-5";
    const patientName = "Clara Campo";

    // 1. Connect to app-terminales (Port 8002) to admit the patient
    const socketTerminales = io("http://localhost:8002", {
        path: "/ws-administrativas",
        transports: ["websocket"]
    });

    socketTerminales.on("connect", () => {
        console.log("🔌 Connected to app-terminales (Cloud environment)");
        console.log(`Sending 'admitir_paciente' for ${patientName} (RUT: ${patientRut})...`);
        socketTerminales.emit("admitir_paciente", {
            rut: patientRut,
            nombre: patientName,
            diagnostico: "Ingreso inicial por consulta general"
        });
    });

    socketTerminales.on("paciente_admitido_confirmado", (data) => {
        console.log("📩 Admission confirmed in Cloud:", data);
        socketTerminales.disconnect();

        // 2. Wait 2 seconds for replication to occur, then connect to app-estaciones (Port 8001) to query the patient
        console.log("⏱️ Waiting 2 seconds for logical replication to sync...");
        setTimeout(() => {
            queryPatientOnLocal();
        }, 2000);
    });

    socketTerminales.on("connect_error", (err) => {
        console.error("❌ app-terminales Connection Error:", err.message);
    });

    function queryPatientOnLocal() {
        const socketMedicas = io("http://localhost:8001", {
            path: "/ws-medicas/",
            transports: ["websocket"]
        });

        socketMedicas.on("connect", () => {
            console.log("🔌 Connected to app-estaciones (Local environment)");
            console.log(`Querying patient with RUT: ${patientRut} on local database...`);
            socketMedicas.emit("consultar_paciente", { rut: patientRut });
        });

        socketMedicas.on("ficha_paciente", (data) => {
            console.log("📩 Received 'ficha_paciente' from local:", data);
            if (data.estado === "OK" && data.datos && data.datos.nombre === patientName) {
                console.log("✅ SUCCESS: Patient admitted on Cloud has successfully replicated to Local database!");
                
                // Let's test the reverse: update diagnosis locally and verify replication to cloud
                updateDiagnosisOnLocal(socketMedicas, data.datos.id);
            } else {
                console.error("❌ FAILURE: Patient not found or data mismatch in local database:", data);
                socketMedicas.disconnect();
                process.exit(1);
            }
        });

        socketMedicas.on("connect_error", (err) => {
            console.error("❌ app-estaciones Connection Error:", err.message);
            process.exit(1);
        });
    }

    function updateDiagnosisOnLocal(socketMedicas, patientId) {
        const newDiagnosis = "DIAGNÓSTICO: Migraña tensional moderada. RECETA: Paracetamol 1g cada 8 horas.";
        console.log(`Updating diagnosis for patient ${patientId} on Local...`);
        socketMedicas.emit("actualizar_diagnostico", {
            id: patientId,
            diagnostico: newDiagnosis
        });

        socketMedicas.on("diagnostico_actualizado", (data) => {
            console.log("📩 Received 'diagnostico_actualizado' from local:", data);
            if (data.estado === "OK" && data.datos.diagnostico === newDiagnosis) {
                console.log("✅ Diagnosis updated successfully on Local!");
                socketMedicas.disconnect();

                // Wait 2 seconds for replication back to cloud, then verify in db-nube
                console.log("⏱️ Waiting 2 seconds for replication to sync to Cloud...");
                setTimeout(() => {
                    verifyDiagnosisOnCloud(patientId, newDiagnosis);
                }, 2000);
            } else {
                console.error("❌ FAILURE: Diagnosis update failed on local:", data);
                socketMedicas.disconnect();
                process.exit(1);
            }
        });
    }

    function verifyDiagnosisOnCloud(patientId, expectedDiagnosis) {
        console.log(`Verifying patient ${patientId} diagnosis in db-nube...`);
        
        // We will execute a query inside db-nube container
        const { exec } = require("child_process");
        exec(`docker exec db-nube psql -U postgres -d clinica -t -c "SELECT diagnostico FROM fichas_pacientes WHERE id = '${patientId}';"`, (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error running docker exec query:", error.message);
                process.exit(1);
            }
            const diagnosis = stdout.trim();
            console.log("Query output from db-nube:", diagnosis);
            if (diagnosis.includes(expectedDiagnosis)) {
                console.log("✅ SUCCESS: Updated diagnosis on Local has successfully replicated to Cloud database!");
                console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
                process.exit(0);
            } else {
                console.error("❌ FAILURE: Updated diagnosis not found or mismatch in Cloud database:", diagnosis);
                process.exit(1);
            }
        });
    }
}

runEndToEndTest();
