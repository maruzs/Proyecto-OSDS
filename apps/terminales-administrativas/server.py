import os
import uuid
import datetime
import socketio
import asyncpg
import aiohttp
from aiohttp import web

# 1. Configuración del Servidor Socket.io asíncrono
# Se configura el path coincidiendo con el mapeado por Nginx: /ws-administrativas
sio = socketio.AsyncServer(cors_allowed_origins="*")
app = web.Application()
sio.attach(app, socketio_path="/ws-administrativas")

# Pool de conexiones de base de datos
db_pool = None

async def init_db():
    global db_pool
    print("[SISTEMA] Iniciando conexión con pool de PostgreSQL...")
    db_pool = await asyncpg.create_pool(
        host=os.getenv("DB_HOST", "db-nube-proxy"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres_secure_pass"),
        database=os.getenv("DB_NAME", "clinica")
    )
    print("[SISTEMA] Conexión establecida con db-nube-proxy.")

@sio.event
async def connect(sid, environ):
    print(f"[CONEXIÓN] Cliente conectado (nube). ID Socket: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[DESCONEXIÓN] Cliente desconectado (nube). ID Socket: {sid}")

@sio.event
async def admitir_paciente(sid, data):
    print(f"[ADMISIÓN] Solicitud recibida: {data}")
    
    # 1. Validación de campos obligatorios
    if not data or not data.get("rut") or not data.get("nombre"):
        print(f"[ERROR] Datos insuficientes para admitir paciente: {data}")
        await sio.emit("error_admision", {"error": "RUT y nombre requeridos"}, to=sid)
        return

    # 2. Filtro SecOps: Control de Acceso basado en Roles (RBAC)
    rol = data.get("rol", "")
    if not rol or rol.lower() != "administrativo":
        print(f"[SECOPS_RECHAZO] Intento de admisión no autorizado por rol: {rol}")
        await sio.emit("error_admision", {"error": "Acceso denegado. Se requiere rol Administrativo."}, to=sid)
        return

    # 3. Creación del objeto de la ficha
    ficha_id = str(uuid.uuid4())
    rut = data["rut"]
    nombre = data["nombre"]
    diagnostico = data.get("diagnostico", "Ingreso Administrativo / En espera de atencion")
    origen_registro = "nube" # Metadato clave para la replicación condicional Postgres

    try:
        # Insertar registro usando el pool de conexiones asíncrono
        async with db_pool.acquire() as conn:
            query = """
                INSERT INTO fichas_pacientes (id, rut, nombre, diagnostico, origen_registro)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, rut, nombre, diagnostico, origen_registro, fecha_actualizacion;
            """
            row = await conn.fetchrow(
                query,
                ficha_id,
                rut,
                nombre,
                diagnostico,
                origen_registro
            )
            
            # Formatear el resultado como diccionario
            res_data = dict(row)
            res_data["id"] = str(res_data["id"])
            if isinstance(res_data.get("fecha_actualizacion"), (datetime.date, datetime.datetime)):
                res_data["fecha_actualizacion"] = res_data["fecha_actualizacion"].isoformat()

            print(f"[OK] Paciente admitido y guardado en db-nube. ID: {res_data['id']}")

            # Notificar al Middleware (VM3)
            middleware_url = os.getenv("MIDDLEWARE_URL", "http://10.128.0.30:8000/api/mw/pacientes")
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(middleware_url, json=res_data) as resp:
                        mw_res = await resp.json()
                        print(f"[MIDDLEWARE] Notificacion enviada. Respuesta: {mw_res}")
            except Exception as err_mw:
                print(f"[MIDDLEWARE_ERROR] Error al notificar al Middleware: {err_mw}")

            # Difusión masiva a todos los clientes conectados
            await sio.emit("paciente_admitido_confirmado", res_data)

    except Exception as err:
        print(f"[DB_ERROR] Error al insertar en db-nube: {err}")
        await sio.emit("error_admision", {"error": str(err)}, to=sid)

async def start_background_tasks(app_obj):
    await init_db()

async def cleanup_background_tasks(app_obj):
    if db_pool:
        await db_pool.close()
        print("[SISTEMA] Pool de base de datos cerrado.")

# Vincular eventos de inicio y parada de aiohttp
app.on_startup.append(start_background_tasks)
app.on_cleanup.append(cleanup_background_tasks)

if __name__ == "__main__":
    PORT = 8002
    print(f"[SISTEMA] Servidor de Terminales Administrativas (Python) en puerto {PORT}...")
    web.run_app(app, port=PORT)
