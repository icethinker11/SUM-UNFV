from flask import Blueprint, request, jsonify
from database.db import get_db
import bcrypt

# Inicializamos el Blueprint.
auth_bp = Blueprint("auth", __name__)

# --- NOTA IMPORTANTE ---
# EL MANEJO DEL ERROR 404 OPTIONS (CORS) DEBE RESOLVERSE 
# EN EL ARCHIVO PRINCIPAL DE TU APLICACIÓN (app.py o main.py) 
# USANDO FLASK-CORS ASÍ:
#
# from flask_cors import CORS
# ...
# app = Flask(__name__)
# CORS(app, resources={r"/auth/*": {"origins": "*"}}) # Aplica CORS a todas las rutas bajo /auth
# app.register_blueprint(auth_bp, url_prefix='/auth')
#
# Si no haces esto, este código funcionará, pero seguirás viendo el error OPTIONS 404.

def authenticate_user(correo, contrasena, expected_rol):
    """Función unificada para verificar credenciales y rol."""
    conn = get_db()
    cur = conn.cursor()
    
    # 1. Buscar usuario y su rol
    cur.execute("""
        SELECT u.usuario_id, u.contrasena, r.nombre_rol 
        FROM usuario u
        JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        JOIN rol r ON ur.rol_id = r.rol_id
        WHERE u.correo = %s
    """, (correo,))
    result = cur.fetchone()
    cur.close()
    conn.close()

    if not result:
        return jsonify({"error": "Usuario o correo no encontrado"}), 404

    user_id, password_db, actual_rol = result
    
    # 2. Verificar que el rol coincida con la ruta solicitada
    if actual_rol.lower() != expected_rol.lower():
        return jsonify({"error": f"Acceso denegado: Este usuario no es un {expected_rol}"}), 403

    # 3. Verificar contraseña (asumiendo bcrypt para todos excepto SuperAdmin por ahora)
    # NOTA: En tu código anterior solo SuperAdmin NO usaba bcrypt. 
    # Mantenemos esa lógica aquí por si aplica a otros roles.
    
    is_valid = False
    if actual_rol == "SuperAdmin":
        # Caso SuperAdmin (contraseña plana)
        is_valid = (contrasena == password_db)
    else:
        # Caso Docente/Estudiante/Admin (contraseña hasheada)
        try:
            is_valid = bcrypt.checkpw(contrasena.encode(), password_db.encode())
        except Exception:
            # Esto puede ocurrir si el hash está mal formateado o es None
            return jsonify({"error": "Error de verificación de contraseña"}), 500

    if is_valid:
        return jsonify({"usuario_id": user_id, "rol": actual_rol}), 200
    else:
        return jsonify({"error": "Credenciales inválidas"}), 401


# ----------------------------------------------------
# RUTAS SEPARADAS PARA CADA ROL
# ----------------------------------------------------

@auth_bp.route("/login/admin", methods=["POST"])
def login_admin():
    data = request.json
    return authenticate_user(data.get("correo"), data.get("contrasena"), "Admin")

@auth_bp.route("/login/docente", methods=["POST"])
def login_docente():
    data = request.json
    return authenticate_user(data.get("correo"), data.get("contrasena"), "Docente")

@auth_bp.route("/login/alumno", methods=["POST"])
def login_alumno():
    data = request.json
    return authenticate_user(data.get("correo"), data.get("contrasena"), "Alumno")

# Puedes mantener esta ruta si la necesitas, pero ahora es redundante.
@auth_bp.route("/login/aplicativo", methods=["POST"])
def login_superadmin():
    data = request.json
    return authenticate_user(data.get("correo"), data.get("contrasena"), "SuperAdmin")

# Si deseas mantener la ruta genérica /login
@auth_bp.route("/login", methods=["POST"])
def login_generic():
    # Esta ruta debería ser eliminada o modificada si solo usas las rutas específicas.
    return jsonify({"error": "Por favor, use la ruta de login específica del rol."}), 400
