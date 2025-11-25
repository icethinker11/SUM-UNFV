from flask import Blueprint

# Blueprint principal del docente
docentes_bp = Blueprint('docente', __name__)

# Importar los sub-blueprints existentes
from .calificaciones import calificaciones_bp
from .perfil_routes import perfil_bp

# Nuevos sub-blueprints
from .material_routes import material_bp
from .calendario_routes import calendario_bp
from .asistencia_routes import asistencia_bp  # ⬅️ NUEVO

# Registrar sub-blueprints
docentes_bp.register_blueprint(calificaciones_bp, url_prefix="/calificaciones")
docentes_bp.register_blueprint(perfil_bp, url_prefix="/perfil")

# NUEVOS
docentes_bp.register_blueprint(material_bp, url_prefix="/material")
docentes_bp.register_blueprint(calendario_bp, url_prefix="/calendario")
docentes_bp.register_blueprint(asistencia_bp, url_prefix="/asistencia")
