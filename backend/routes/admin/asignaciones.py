# En: backend/routes/admin/asignaciones.py

from flask import Blueprint, jsonify

# --- ESTA ES LA CORRECCIÓN ---
# Importa 'perfiladmin_bp' (el nombre de variable correcto) 
# desde 'perfiladmin.py' (el archivo correcto) usando una importación relativa (el punto).
from .perfiladmin import perfiladmin_bp 

# --- ESTO RESUELVE EL ERROR DE app.py ---
# Define el blueprint que tu app principal está intentando importar.
asignaciones_bp = Blueprint('asignaciones', __name__, url_prefix='/asignaciones')


# Ruta de ejemplo para verificar que funciona
@asignaciones_bp.route('/')
def index():
    return jsonify({"mensaje": "Bienvenido a la sección de asignaciones"})

#
# Aquí puedes añadir tus rutas CRUD para asignaciones
#