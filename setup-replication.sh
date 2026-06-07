#!/bin/bash
# Script para configurar la replicación desde Cloud Shell usando gcloud

ZONE="us-central1-a"

echo "=== Configurando Replicación Lógica Bidireccional en GCP ==="

# 1. En vm-nube-central (VM-2), crear la suscripción que lee de vm-hospital-local (VM-1)
echo "Configurando Suscripción en vm-nube-central..."
gcloud compute ssh vm-nube-central --zone=$ZONE --command="sudo docker exec -i db-nube psql -U postgres -d clinica -c \"DROP SUBSCRIPTION IF EXISTS sub_desde_local;\" && sudo docker exec -i db-nube psql -U postgres -d clinica -c \"CREATE SUBSCRIPTION sub_desde_local CONNECTION 'host=10.128.0.10 port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_local_a_nube WITH (copy_data = false, origin = none);\""

# 2. En vm-hospital-local (VM-1), crear la suscripción que lee de vm-nube-central (VM-2)
echo "Configurando Suscripción en vm-hospital-local..."
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="sudo docker exec -i db-local psql -U postgres -d clinica -c \"DROP SUBSCRIPTION IF EXISTS sub_desde_nube;\" && sudo docker exec -i db-local psql -U postgres -d clinica -c \"CREATE SUBSCRIPTION sub_desde_nube CONNECTION 'host=10.128.0.20 port=5432 dbname=clinica user=postgres password=postgres_secure_pass' PUBLICATION pub_nube_a_local WITH (copy_data = false, origin = none);\""

echo "=== Replicación Configurada e Iniciada con Éxito ==="
