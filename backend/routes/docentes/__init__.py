from flask import Blueprint

docentes_bp = Blueprint('docentes', __name__, url_prefix='/docentes')

from .perfil_routes import *
from .calificaciones_routes import *
from .materiales_routes import *
from .asistencia_routes import *
from .reportes_routes import *
