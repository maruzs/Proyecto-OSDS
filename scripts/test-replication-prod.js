const { io } = require("socket.io-client");

const DOMAIN = "https://osds.epistia.cl";
const patientRut = "99999999-9";
const patientName = "Test Replicacion Cloud";

console.log("=== Testing End-to-End Replication via Production Gateway ===");

const socketTerminales = io(DOMAIN, {
    path: "/ws-administrativas",
    transports: ["websocket"]
});

socketTerminales.on("connect", () => {
    console.log("Connected to app-terminales (Cloud) via Gateway");
    console.log("Admitting patient " + patientName + " (RUT: " + patientRut + ")...");
    socketTerminales.emit("admitir_paciente", {
        rut: patientRut,
        nombre: patientName,
        diagnostico: "Test replicacion desde cloud",
        rol: "administrativo"
    });
});

socketTerminales.on("paciente_admitido_confirmado", (data) => {
    console.log("Admission confirmed in Cloud:", data);
    const patientId = data.id;
    socketTerminales.disconnect();

    console.log("Waiting 3 seconds for logical replication to sync...");
    setTimeout(() => {
        queryPatientOnLocal(patientId);
    }, 3000);
});

socketTerminales.on("connect_error", (err) => {
    console.error("app-terminales Connection Error:", err.message);
    process.exit(1);
});

function queryPatientOnLocal(expectedId) {
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
        if (data.estado === "OK" && data.datos && data.datos.id === expectedId) {
            console.log("SUCCESS: Patient admitted on Cloud has successfully replicated to Local database!");
            socketMedicas.disconnect();
            process.exit(0);
        } else {
            console.error("FAILURE: Patient not found or data mismatch in local database:", data);
            socketMedicas.disconnect();
            process.exit(1);
        }
    });

    socketMedicas.on("connect_error", (err) => {
        console.error("app-estaciones Connection Error:", err.message);
        process.exit(1);
    });
}