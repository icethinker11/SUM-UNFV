from flask import Blueprint

# Blueprint principal del módulo SuperAdmin
superadmin_bp = Blueprint('superadmin', __name__)

# ====== Importar todos los submódulos ======
from .admins import admins_bp
from .ubicaciones import ubicaciones_bp
from .academico import academico_bp
from .cursos import cursos_bp
from .bloques_horarios import bloques_horarios_bp
from .prerrequisitos import prerrequisitos_bp
from .pabellones import pabellones_bp
from .aulas import aulas_bp

# ====== Registrar los blueprints internos ======
superadmin_bp.register_blueprint(admins_bp, url_prefix="/admins")
superadmin_bp.register_blueprint(ubicaciones_bp, url_prefix="/ubicaciones")
superadmin_bp.register_blueprint(academico_bp, url_prefix="/academico")
superadmin_bp.register_blueprint(cursos_bp, url_prefix="/cursos")
superadmin_bp.register_blueprint(bloques_horarios_bp, url_prefix="") 
superadmin_bp.register_blueprint(prerrequisitos_bp, url_prefix="")
superadmin_bp.register_blueprint(pabellones_bp, url_prefix="/pabellones")
superadmin_bp.register_blueprint(aulas_bp, url_prefix="/aulas")

# 👇 Añade esto al final (import explícito)
__all__ = ["superadmin_bp"]