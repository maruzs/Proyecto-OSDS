const { exec } = require("child_process");

const cmd = `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master psql -U postgres -d clinica -c \\"ALTER TABLE fichas_pacientes REPLICA IDENTITY FULL;\\""`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error("Error:", error.message);
        console.error("stderr:", stderr);
        return;
    }
    console.log("stdout:", stdout);
});