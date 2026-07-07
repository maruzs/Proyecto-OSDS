const { exec } = require("child_process");

function runCmd(command) {
    return new Promise((resolve) => {
        console.log(`[EXEC] ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[ERROR]`, error.message);
                resolve({ error, stdout: stdout.trim(), stderr: stderr.trim() });
            } else {
                console.log(`[OK]`);
                resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            }
        });
    });
}

async function main() {
    console.log("=== Setting up logical replication on GCP VMs ===");

    // VM2 (Nube Central): Drop subscription if exists, create publication
    await runCmd(
        `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -c \\"DROP SUBSCRIPTION IF EXISTS sub_desde_local;\\"" --quiet`
    );
    await runCmd(
        `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -c \\"DROP PUBLICATION IF EXISTS pub_nube_a_local;\\"" --quiet`
    );
    await runCmd(
        `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -c \\"CREATE PUBLICATION pub_nube_a_local FOR TABLE fichas_pacientes WHERE (origen_registro = 'nube');\\"" --quiet`
    );

    // VM1 (Hospital Local): Drop subscription if exists, create publication
    await runCmd(
        `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master psql -U postgres -d clinica -c \\"DROP SUBSCRIPTION IF EXISTS sub_desde_nube;\\"" --quiet`
    );
    await runCmd(
        `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master psql -U postgres -d clinica -c \\"DROP PUBLICATION IF EXISTS pub_local_a_nube;\\"" --quiet`
    );
    await runCmd(
        `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master psql -U postgres -d clinica -c \\"CREATE PUBLICATION pub_local_a_nube FOR TABLE fichas_pacientes WHERE (origen_registro = 'local');\\"" --quiet`
    );

    // VM2 (Nube Central): Create subscription to VM1 (Hospital Local)
    // db-local (defined in extra_hosts on db-nube-master) points to VM1's IP 10.128.0.10
    await runCmd(
        `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -c \\"CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false, origin = none);\\"" --quiet`
    );

    // VM1 (Hospital Local): Create subscription to VM2 (Nube Central)
    // db-nube (defined in extra_hosts on db-local-master) points to VM2's IP 10.128.0.20
    await runCmd(
        `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master psql -U postgres -d clinica -c \\"CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=db-nube port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false, origin = none);\\"" --quiet`
    );

    console.log("=== Verifying replication setup ===");
    const resNube = await runCmd(
        `gcloud compute ssh vm-nube-central --zone=us-central1-a --command="sudo docker exec db-nube-master psql -U postgres -d clinica -c \\"SELECT subname, subenabled, subpublications FROM pg_subscription;\\"" --quiet`
    );
    console.log("db-nube-master subscriptions:\n", resNube.stdout);

    const resLocal = await runCmd(
        `gcloud compute ssh vm-hospital-local --zone=us-central1-a --command="sudo docker exec db-local-master psql -U postgres -d clinica -c \\"SELECT subname, subenabled, subpublications FROM pg_subscription;\\"" --quiet`
    );
    console.log("db-local-master subscriptions:\n", resLocal.stdout);
}

main();
