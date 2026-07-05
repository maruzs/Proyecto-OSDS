const { io } = require("socket.io-client");
const socket = io("https://osds.epistia.cl", {
    path: "/ws-administrativas",
    transports: ["websocket"]
});
socket.on("connect", () => {
    console.log("✅ Connected to administrativas!");
    socket.disconnect();
});
socket.on("connect_error", (err) => {
    console.error("❌ Error administrativas:", err.message);
    process.exit(1);
});
