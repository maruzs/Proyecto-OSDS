const { exec } = require("child_process");

const cmds = [
    // VM1 - db-local-master: allow replication from any host in the docker network
    `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master bash -c \\"echo 'host replication replicator 0.0.0.0/0 md5' >> /var/lib/postgresql/data/pg_hba.conf && psql -U postgres -c 'SELECT pg_reload_conf();'\\""`
];

cmds.forEach((cmd, i) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("Error [" + i + "]:", error.message);
            console.error("stderr:", stderr);
            return;
        }
        console.log("Result [" + i + "]:", stdout);
    });
});