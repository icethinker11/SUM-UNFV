from flask import Blueprint, request, jsonify
from database.db import get_db
import bcrypt
from datetime import date 

auth_bp = Blueprint("auth", __name__)

# --------------------------
# 🔹 Función auxiliar para calcular el ciclo actual
# --------------------------
def obtener_ciclo_actual():
    hoy = date.today()
    año = hoy.year
    mes = hoy.month
    # Enero a Junio → I, Julio a Diciembre → II
    ciclo = f"{año}-I" if mes <= 6 else f"{año}-II"
    return ciclo

# --------------------------
# 🔹 Función general de autenticación
# --------------------------
def authenticate_user(correo, contrasena, expected_rol):
    conn = get_db()
    cur = conn.cursor()

    # 1. Autenticación inicial (Usuario y Rol)
    cur.execute("""
        SELECT u.usuario_id, u.contrasena, r.nombre_rol
        FROM usuario u
        JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        JOIN rol r ON ur.rol_id = r.rol_id
        WHERE u.correo = %s
    """, (correo,))
    result = cur.fetchone()

    if not result:
        cur.close()
        conn.close()
        return jsonify({"error": "Usuario o correo no encontrado"}), 404

    user_id, password_db, actual_rol = result

    # Verificar que el rol coincida con la ruta solicitada
    if actual_rol.lower() != expected_rol.lower():
        cur.close()
        conn.close()
        return jsonify({"error": f"Acceso denegado: Este usuario no es un {expected_rol}"}), 403

    # Verificar contraseña
    try:
        if actual_rol == "SuperAdmin":
            is_valid = contrasena == password_db
        else:
            is_valid = bcrypt.checkpw(contrasena.encode(), password_db.encode())
    except Exception as e:
        cur.close()
        conn.close()
        return jsonify({"error": f"Error de verificación de contraseña: {str(e)}"}), 500

    if not is_valid:
        cur.close()
        conn.close()
        return jsonify({"error": "Credenciales inválidas"}), 401

    # --- CONSULTAS ESPECÍFICAS DE ROL CORREGIDAS ---

    # 💡 Si es ALUMNO
    if expected_rol.lower() == "alumno":
        ciclo_actual = obtener_ciclo_actual()
        cur.execute("""
            SELECT e.estudiante_id, p.nombres, p.apellidos
            FROM estudiante e
            JOIN persona p ON e.persona_id = p.persona_id
            WHERE p.usuario_id = %s  -- ✅ CORRECCIÓN: Usar p.usuario_id en lugar de e.usuario_id
        """, (user_id,))
        info = cur.fetchone()
        cur.close()
        conn.close()
        if not info:
            return jsonify({"error": "No se encontró información del alumno"}), 404

        estudiante_id, nombres, apellidos = info
        return jsonify({
            "usuario_id": user_id,
            "estudiante_id": estudiante_id,
            "nombre": f"{nombres} {apellidos}",
            "rol": actual_rol,
            "ciclo_actual": ciclo_actual
        }), 200

    # 💡 Si es DOCENTE
    if expected_rol.lower() == "docente":
        cur.execute("""
            SELECT d.docente_id, p.nombres, p.apellidos
            FROM docente d
            JOIN persona p ON d.persona_id = p.persona_id
            WHERE p.usuario_id = %s  -- ✅ CORRECCIÓN: Usar p.usuario_id en lugar de d.usuario_id
        """, (user_id,))
        info = cur.fetchone()
        cur.close()
        conn.close()
        if not info:
            return jsonify({"error": "No se encontró información del docente"}), 404

        docente_id, nombres, apellidos = info
        return jsonify({
            "usuario_id": user_id,
            "docente_id": docente_id,
            "nombre": f"{nombres} {apellidos}",
            "rol": actual_rol
        }), 200

    # 💡 Si es ADMIN o SUPERADMIN
    cur.close()
    conn.close()
    return jsonify({
        "usuario_id": user_id,
        "rol": actual_rol
    }), 200

# --------------------------
# 🔹 Rutas de login específicas
# --------------------------
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

@auth_bp.route("/login/aplicativo", methods=["POST"])
def login_superadmin():
    data = request.json
    return authenticate_user(data.get("correo"), data.get("contrasena"), "SuperAdmin")

@auth_bp.route("/login", methods=["POST"])
def login_generic():
    return jsonify({"error": "Por favor, use la ruta de login específica del rol."}), 400