# Dentro de: routes/admin/horarios.py
from flask import Blueprint, jsonify

# Define el Blueprint (esto arregla el error de importación)
horarios_bp = Blueprint('horarios', __name__, url_prefix='/horarios')

# Ruta de ejemplo para verificar que funciona
@horarios_bp.route('/')
def index():
    return jsonify({"mensaje": "Bienvenido a la sección de horarios"})

# Aquí puedes añadir el resto de tus rutas CRUD para horarios...