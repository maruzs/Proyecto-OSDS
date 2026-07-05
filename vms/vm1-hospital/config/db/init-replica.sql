-- Configuración inicial de la Réplica MariaDB - Hospital Local
CHANGE MASTER TO
  MASTER_HOST='db-local-master',
  MASTER_USER='repl',
  MASTER_PASSWORD='repl_secure_pass',
  MASTER_PORT=3306;
START SLAVE;
