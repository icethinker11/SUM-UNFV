from flask import Blueprint

# Blueprint principal del módulo Admin
admin_bp = Blueprint('admin', __name__)

# ====== Importar todos los submódulos ======
from .perfil import perfil_bp

# ====== Registrar los blueprints internos ======
admin_bp.register_blueprint(perfil_bp, url_prefix="")

# 👇 Añade esto al final (import explícito)
__all__ = ["admin_bp"]