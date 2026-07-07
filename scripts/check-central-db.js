const { exec } = require("child_process");

const cmd = `gcloud compute ssh vm-gateway --zone=us-central1-a --command="sudo docker exec db-central-master psql -U postgres -d clinica_central -c \\"SELECT COUNT(*) as admisiones FROM registro_admisiones; SELECT COUNT(*) as diagnosticos FROM auditoria_diagnosticos; SELECT * FROM inventario_insumos;\\""`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error("Error:", error.message);
        console.error("stderr:", stderr);
        return;
    }
    console.log("Central DB status:");
    console.log(stdout);
});