-- Configuración inicial de la Réplica MySQL Central
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST_NAME='db-central-master',
  SOURCE_USER_NAME='repl',
  SOURCE_PASSWORD='repl_secure_pass',
  SOURCE_PORT=3306;
START REPLICA;
