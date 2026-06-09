La vm-gateway esta en DMZ. Dentro de esa vm encontramos todo lo relacionado a SecOps, como lo son el contenedor para el Nginx reverse proxy y el contenedor para cloudflared tunnel.

EL Nginx tiene un rate limiting sobre las rutas principales de los websockets (Estaciones médicas y terminales administrativas).

El NPM paso a ser un firewall a nivel de aplicacion gracias a diversas configuraciones de seguridad, como lo son:
- Ocultar la version para que atacantes no puedan buscar vulnerabilidades asociadas.
- Limitar el tamaño del cuerpo de la peticion.
- Inyectar cabeceras de seguridad como SAMEORIGIN, nosniff, X-XSS-Protection y Content Security Policy (CSP).
- Habilitar rate limiting para evitar ataques de denegacion de servicio por inundacion de handshakes de WebSockets.

No se exponen los puertos Ingress a la VM en GCP para evitar que cualquier IP publica pueda escanear la VM en busqueda de vulnerabilidades, en cambio se abre un canal de salida cifrado hacia los servidores de cloudflare. De esa manera todo el trafico entra a la red global de cloudflare que ya viene con diversas protecciones, haciendo que se disminuya la superficie de ataque.

El compose segmenta el trafico a las siguientes redes:
- DMZ_net que conecta el tunel con el NPM
- Hospital_net y Cloud_net que aislans los proxies hacia los backend, evitando movimiento lateral si hay un contenedor comprometido.

Para evitar los bucles infinitos en la replicacion bidireccional se implementaron 2 capas.
- Ambas bases de datos (local y nube) tienen una columna origen_registro para saber de donde proviene el registro y que solo se publique el registro si proviene del publicador.
- Aplicar filtros en los publish (local y nube) para que solo publiquen registros que provengan del publicador.
