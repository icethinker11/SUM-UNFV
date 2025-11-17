import os
from flask import Flask
from flask_cors import CORS

# Importa la configuración desde tu archivo config.py
from config import config_by_name

# Importa tus rutas y extensiones
from routes.alumno import alumno_bp
from routes.auth_routes import auth_bp
from routes.superadmin import superadmin_bp
from routes.admin import admin_bp  #  Importar desde routes.admin (usa el __init__.py)
from routes.curso_routes import curso_bp
from database.db import init_db
from extensions import mail
from routes.docentes import docentes_bp  #  importa el módulo docentes
# Determina qué configuración usar leyendo la variable FLASK_CONFIG de tu .env
config_name = os.getenv('FLASK_CONFIG', 'default')

# Crea la instancia de la aplicación Flask
app = Flask(__name__)

# Carga la configuración correspondiente en la aplicación
app.config.from_object(config_by_name[config_name])

# Habilita CORS para permitir peticiones desde tu frontend
CORS(app)

# Inicializa las extensiones con la aplicación
mail.init_app(app)
init_db(app)

# Registra los Blueprints (los diferentes módulos de tu API)
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(superadmin_bp, url_prefix="/superadmin")
app.register_blueprint(admin_bp, url_prefix="/admin")  # Ahora incluye todos los sub-blueprints
app.register_blueprint(curso_bp, url_prefix="/curso")
app.register_blueprint(docentes_bp, url_prefix="/api")  # ya tiene su propio url_prefix
app.register_blueprint(alumno_bp, url_prefix="/alumno")


@app.route("/")
def home():
    return {"mensaje": "API Flask SUM_UNFV_3.0 corriendo 🚀"}

if __name__ == "__main__":
    print("\n🔍 Rutas registradas en Flask:")
    for rule in app.url_map.iter_rules():
        print(rule)
    print("=================================\n")

    app.run(host="0.0.0.0", port=5000)
