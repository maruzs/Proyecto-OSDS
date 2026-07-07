#!/bin/bash
# Permitir conexiones de replicación física desde cualquier host de la red Docker
echo "host replication replicator 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
