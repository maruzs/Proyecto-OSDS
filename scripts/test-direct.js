const { io } = require("socket.io-client");
const { Client } = require("pg");

async function testWebsocketsDirect() {
    console.log("--- STARTING DIRECT WEBSOCKET TESTS ---");

    // 1. Test app-estaciones (Port 8001)
    console.log("\n1. Connecting to app-estaciones directly on port 8001...");
    const socketMedicas = io("http://localhost:8001", {
        path: "/ws-medicas/"
    });

    socketMedicas.on("connect", () => {
        console.log("✅ Connected to app-estaciones directly!");
        
        // Let's query a patient
        console.log("Sending 'consultar_paciente' for RUT 12345678-9...");
        socketMedicas.emit("consultar_paciente", { rut: "12345678-9" });
    });

    socketMedicas.on("ficha_paciente", (data) => {
        console.log("📩 Received 'ficha_paciente' response:", data);
        
        if (data.estado === "OK" && data.datos.nombre === "Juan Pérez") {
            console.log("✅ Patient data retrieved successfully!");
            
            // Let's test actualizacion
            console.log("Sending 'actualizar_diagnostico' for Maria Loyola...");
            socketMedicas.emit("actualizar_diagnostico", {
                id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                diagnostico: "DIAGNÓSTICO: Esguince tobillo derecho grado 2. RECETA: Ibuprofeno 600mg y reposo."
            });
        } else {
            console.log("❌ Failed to retrieve correct patient data:", data);
        }
    });

    socketMedicas.on("diagnostico_actualizado", (data) => {
        console.log("📩 Received 'diagnostico_actualizado' response:", data);
        if (data.estado === "OK") {
            console.log("✅ Diagnosis updated successfully!");
        } else {
            console.log("❌ Failed to update diagnosis:", data);
        }
        socketMedicas.disconnect();
    });

    socketMedicas.on("connect_error", (err) => {
        console.error("❌ Connection error on app-estaciones:", err.message);
    });

    // 2. Test app-terminales (Port 8002)
    console.log("\n2. Connecting to app-terminales directly on port 8002...");
    const socketTerminales = io("http://localhost:8002", {
        path: "/ws-administrativas"
    });

    socketTerminales.on("connect", () => {
        console.log("✅ Connected to app-terminales directly!");
        
        // Let's admit a new patient
        console.log("Sending 'admitir_paciente' for RUT 33333333-3...");
        socketTerminales.emit("admitir_paciente", {
            rut: "33333333-3",
            nombre: "Pedro Marmol",
            diagnostico: "Ingreso por control de rutina"
        });
    });

    socketTerminales.on("paciente_admitido_confirmado", (data) => {
        console.log("📩 Received 'paciente_admitido_confirmado' response:", data);
        if (data.rut === "33333333-3") {
            console.log("✅ Patient admission confirmed successfully!");
        } else {
            console.log("❌ Failed to confirm correct patient admission:", data);
        }
        socketTerminales.disconnect();
    });

    socketTerminales.on("connect_error", (err) => {
        console.error("❌ Connection error on app-terminales:", err.message);
    });
}

testWebsocketsDirect();
