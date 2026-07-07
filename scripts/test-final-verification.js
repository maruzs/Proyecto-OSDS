const { io } = require("socket.io-client");

const DOMAIN = "https://osds.epistia.cl";
const patientRut = "55555555-" + Math.floor(Math.random() * 9000 + 1000);
const patientName = "Final Verification Test";

console.log("=== Final End-to-End Replication Test ===");
console.log("Using unique RUT: " + patientRut);

const socketTerminales = io(DOMAIN, {
    path: "/ws-administrativas",
    transports: ["websocket"]
});

socketTerminales.on("connect", () => {
    console.log("Connected to app-terminales (Cloud)");
    socketTerminales.emit("admitir_paciente", {
        rut: patientRut,
        nombre: patientName,
        diagnostico: "Final test diagnosis",
        rol: "administrativo"
    });
});

socketTerminales.on("paciente_admitido_confirmado", (data) => {
    console.log("Patient admitted on Cloud. ID: " + data.id);
    const patientId = data.id;
    socketTerminales.disconnect();
    console.log("Waiting 3s for replication...");
    setTimeout(() => queryLocal(patientId), 3000);
});

function queryLocal(expectedId) {
    const socketMedicas = io(DOMAIN, {
        path: "/ws-medicas",
        transports: ["websocket"]
    });

    socketMedicas.on("connect", () => {
        console.log("Connected to app-estaciones (Local)");
        socketMedicas.emit("consultar_paciente", { rut: patientRut });
    });

    socketMedicas.on("ficha_paciente", (data) => {
        if (data.estado === "OK" && data.datos && data.datos.id === expectedId) {
            console.log("SUCCESS: Patient replicated from Cloud to Local!");
            console.log("  Name: " + data.datos.nombre);
            console.log("  ID: " + data.datos.id);
            socketMedicas.disconnect();
            process.exit(0);
        } else {
            console.error("Mismatch: expected " + expectedId + ", got " + (data.datos ? data.datos.id : "none"));
            socketMedicas.disconnect();
            process.exit(1);
        }
    });

    socketMedicas.on("connect_error", (err) => {
        console.error("Connection error:", err.message);
        process.exit(1);
    });
}