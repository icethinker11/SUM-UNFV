from flask import request
from .perfil_validator import PerfilValidator
from .calificacion_validator import CalificacionValidator
from .material_validator import MaterialValidator
from .asistencia_validator import AsistenciaValidator

__all__ = [
    'PerfilValidator',
    'CalificacionValidator',
    'MaterialValidator',
    'AsistenciaValidator'
]