from flask import Blueprint

alumno_bp = Blueprint("alumno", __name__)

try:
    from .matriculas import matriculas_bp
    alumno_bp.register_blueprint(matriculas_bp, url_prefix="")
    print(" matriculas_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ No se pudo importar matriculas_bp: {e}")
try:
    from .calificaciones import calificaciones_bp
    alumno_bp.register_blueprint(calificaciones_bp, url_prefix="")
    print(" calificaciones_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ No se pudo importar calificaciones_bp: {e}")
try:
    from .asignaciones import asignaciones_bp
    alumno_bp.register_blueprint(asignaciones_bp, url_prefix="")
    print(" asignaciones_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ No se pudo importar asignaciones_bp: {e}")
try:
    from .horario import horario_bp
    alumno_bp.register_blueprint(horario_bp, url_prefix="")
    print(" horario_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ No se pudo importar horario_bp: {e}")
try:
    from .material import material_bp
    alumno_bp.register_blueprint(material_bp, url_prefix="")
    print(" material_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ No se pudo importar material_bp: {e}")

__all__ = ["alumno_bp"]
