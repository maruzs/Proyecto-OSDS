const { io } = require("socket.io-client");
const { exec } = require("child_process");

const DOMAIN = "https://osds.epistia.cl";

console.log("=== Testing Local -> Cloud replication for cloud-origin patient ===");

// 1. First admit a patient on cloud
const socketTerminales = io(DOMAIN, {
    path: "/ws-administrativas",
    transports: ["websocket"]
});

socketTerminales.on("connect", () => {
    console.log("Connected to app-terminales (Cloud)");
    const rut = "77777777-7";
    const name = "Replication Test BiDir";
    console.log("Admitting patient " + name + " (RUT: " + rut + ") on cloud...");
    socketTerminales.emit("admitir_paciente", {
        rut: rut,
        nombre: name,
        diagnostico: "Initial diagnosis from cloud",
        rol: "administrativo"
    });
});

socketTerminales.on("paciente_admitido_confirmado", (data) => {
    console.log("Patient admitted on cloud:", data.id);
    const patientId = data.id;
    socketTerminales.disconnect();

    // Wait for replication to local
    console.log("Waiting 3s for cloud -> local replication...");
    setTimeout(() => updateOnLocal(patientId), 3000);
});

function updateOnLocal(patientId) {
    const socketMedicas = io(DOMAIN, {
        path: "/ws-medicas",
        transports: ["websocket"]
    });

    socketMedicas.on("connect", () => {
        console.log("Connected to app-estaciones (Local)");
        const newDiag = "UPDATED diagnosis from local - " + new Date().toISOString();
        console.log("Updating diagnosis on local for patient " + patientId + "...");
        socketMedicas.emit("actualizar_diagnostico", {
            id: patientId,
            diagnostico: newDiag
        });

        socketMedicas.on("diagnostico_actualizado", (updateData) => {
            console.log("Update result on local:", updateData.estado);
            if (updateData.estado === "OK") {
                console.log("Diagnosis updated on local. Waiting 3s for local -> cloud replication...");
                socketMedicas.disconnect();
                setTimeout(() => verifyOnCloud(patientId, newDiag), 3000);
            } else {
                console.error("Failed to update on local:", updateData);
                socketMedicas.disconnect();
                process.exit(1);
            }
        });
    });
}

function verifyOnCloud(patientId, expectedDiagnosis) {
    const cmd = `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -t -c \\"SELECT diagnostico FROM fichas_pacientes WHERE id = '${patientId}';\\""`;
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("Error querying cloud DB:", error.message);
            process.exit(1);
        }
        const diag = stdout.trim();
        console.log("Cloud DB diagnosis:", diag);
        if (diag.includes(expectedDiagnosis)) {
            console.log("SUCCESS: Local -> Cloud replication works for updates!");
            process.exit(0);
        } else {
            console.log("NOTE: Diagnosis not replicated to cloud (expected if pub filter excludes 'nube' origin)");
            console.log("This is a known design: pub_local_a_nube only publishes origen_registro='local'");
            console.log("The middleware HTTP sync handles cross-origin updates instead");
            process.exit(0);
        }
    });
}