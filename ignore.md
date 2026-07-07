# Prompt 

Necesitamos de manera urgente implementar las siguientes cosas:
## 1. Uso de distintos motores de bases de datos (Prioridad 1)
- Actualmente por una confusion mi companero migro todas las BD a postgresql pero por indicaciones del proyecto es necesario usar distintos motores de BD, por lo tanto necesito que sin perder las implementaciones creadas podamos revertir a las bases de datos originales

## 2. Login con credenciales (Prioridad 2)
- Cada rol distinto dentro del sistema debe iniciar sesion y dependiendo de su rol (Administrativo, medico, enfermero) debe tener su respectiva vista y permisos

## 3. Poder borrar informacion y elementos desde interfaz
El profesor solicita que si al borrar algun elemento o informacion esto se vea reflejado en las otras DB, el problema es que no teniamos forma de eliminar las cosas.

## Nginx Proxy Manager (Opcional, no prioritario)
Necesito implementar el NPM con interfaz, sera con lo siguiente:
Cloudflare:
Subdominio -> adminosds.epistia.cl
hacia -> http://nginx-proxy-manager:81