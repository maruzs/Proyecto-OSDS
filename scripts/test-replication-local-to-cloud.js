const { io } = require("socket.io-client");

const DOMAIN = "https://osds.epistia.cl";
const patientRut = "11111111-1";  // Pre-existing patient Maria Loyola in local DB

console.log("=== Testing Local -> Cloud Replication via Production Gateway ===");

// First, query the patient on local to get their ID
const socketMedicas = io(DOMAIN, {
    path: "/ws-medicas",
    transports: ["websocket"]
});

socketMedicas.on("connect", () => {
    console.log("Connected to app-estaciones (Local) via Gateway");
    console.log("Querying patient with RUT: " + patientRut + " on local database...");
    socketMedicas.emit("consultar_paciente", { rut: patientRut });
});

socketMedicas.on("ficha_paciente", (data) => {
    console.log("Received ficha_paciente from local:", data);
    if (data.estado === "OK" && data.datos) {
        const patientId = data.datos.id;
        console.log("Patient found with ID: " + patientId);
        
        // Now update the diagnosis locally
        const newDiagnosis = "DIAGNOSTICO: Test replicacion LOCAL -> CLOUD " + new Date().toISOString();
        console.log("Updating diagnosis on Local...");
        socketMedicas.emit("actualizar_diagnostico", {
            id: patientId,
            diagnostico: newDiagnosis
        });

        socketMedicas.on("diagnostico_actualizado", (updateData) => {
            console.log("Received diagnostico_actualizado from local:", updateData);
            if (updateData.estado === "OK") {
                console.log("Diagnosis updated successfully on Local!");
                socketMedicas.disconnect();

                // Wait 3 seconds for replication to cloud, then verify via direct DB query
                console.log("Waiting 3 seconds for replication to sync to Cloud...");
                setTimeout(() => {
                    verifyDiagnosisOnCloud(patientId, newDiagnosis);
                }, 3000);
            } else {
                console.error("FAILURE: Diagnosis update failed on local:", updateData);
                socketMedicas.disconnect();
                process.exit(1);
            }
        });
    } else {
        console.error("FAILURE: Patient not found in local database:", data);
        socketMedicas.disconnect();
        process.exit(1);
    }
});

socketMedicas.on("connect_error", (err) => {
    console.error("app-estaciones Connection Error:", err.message);
    process.exit(1);
});

function verifyDiagnosisOnCloud(patientId, expectedDiagnosis) {
    const { exec } = require("child_process");
    console.log("Verifying patient " + patientId + " diagnosis in db-nube (Cloud)...");
    
    // We'll use gcloud to run the query in the cloud VM
    const cmd = "gcloud compute ssh vm-nube-central --zone=us-central1-a --command=\"sudo docker exec db-nube-master psql -U postgres -d clinica -t -c \\\"SELECT diagnostico FROM fichas_pacientes WHERE id = '" + patientId + "';\\\"\" --quiet";
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running gcloud command:", error.message);
            console.error("stderr:", stderr);
            process.exit(1);
        }
        const diagnosis = stdout.trim();
        console.log("Query output from db-nube:", diagnosis);
        if (diagnosis.includes(expectedDiagnosis)) {
            console.log("SUCCESS: Updated diagnosis on Local has successfully replicated to Cloud database!");
            console.log("ALL TESTS PASSED SUCCESSFULLY!");
            process.exit(0);
        } else {
            console.error("FAILURE: Updated diagnosis not found or mismatch in Cloud database:", diagnosis);
            process.exit(1);
        }
    });
}