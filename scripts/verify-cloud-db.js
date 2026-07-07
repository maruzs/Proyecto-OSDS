const { exec } = require("child_process");

const cmd = `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -c \\"SELECT id, nombre, diagnostico, origen_registro, fecha_actualizacion FROM fichas_pacientes WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';\\""`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error("Error:", error.message);
        console.error("stderr:", stderr);
        return;
    }
    console.log("stdout:", stdout);
});