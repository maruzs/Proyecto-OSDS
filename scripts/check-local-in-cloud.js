const { exec } = require("child_process");

const cmd = `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -c \\"SELECT id, nombre, origen_registro FROM fichas_pacientes WHERE origen_registro = 'local';\\""`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error("Error:", error.message);
        console.error("stderr:", stderr);
        return;
    }
    console.log("Local-origin patients in CLOUD DB:");
    console.log(stdout);
});