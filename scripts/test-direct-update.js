const { exec } = require("child_process");

const cmd = `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master psql -U postgres -d clinica -c \\"UPDATE fichas_pacientes SET diagnostico = 'Test update' WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';\\""`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error("Error:", error.message);
        console.error("stderr:", stderr);
        return;
    }
    console.log("stdout:", stdout);
});