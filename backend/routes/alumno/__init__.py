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


__all__ = ["alumno_bp"]
