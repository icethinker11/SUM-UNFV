# routes/admin/__init__.py
from flask import Blueprint

# Blueprint principal del módulo Admin
admin_bp = Blueprint('admin', __name__)

# ====== Importar y registrar sub-blueprints ======

# 1. PERFIL ADMIN
try:
    from .perfiladmin import perfiladmin_bp
    admin_bp.register_blueprint(perfiladmin_bp, url_prefix="")
    print(" perfiladmin_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ Warning: No se pudo importar perfiladmin_bp - {e}")

# 2. DOCENTES
try:
    from .docentes import docentes_bp
    admin_bp.register_blueprint(docentes_bp, url_prefix="")
    print(" docentes_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ Warning: No se pudo importar docentes_bp - {e}")

# 3. ALUMNOS
try:
    from .alumnos import alumnos_bp
    admin_bp.register_blueprint(alumnos_bp, url_prefix="/alumnos")
    print(" alumnos_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ Warning: No se pudo importar alumnos_bp - {e}")

# 4. ESCUELAS
try:
    from .escuelas import escuelas_bp
    admin_bp.register_blueprint(escuelas_bp, url_prefix="")
    print(" escuelas_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ Warning: No se pudo importar escuelas_bp - {e}")

# 5. ASIGNACIONES
try:
    from .asignaciones import asignaciones_bp
    # Important: registrar sin colocar otro prefijo para que queden como /admin/...
    admin_bp.register_blueprint(asignaciones_bp, url_prefix="")
    print("asignaciones_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ Warning: No se pudo importar asignaciones_bp - {e}")

# 6. HORARIOS
try:
    from .horarios import horarios_bp
    admin_bp.register_blueprint(horarios_bp, url_prefix="")
    print(" horarios_bp registrado correctamente")
except ImportError as e:
    print(f"⚠️ Warning: No se pudo importar horarios_bp - {e}")

# Exportar el blueprint principal
__all__ = ["admin_bp"]
