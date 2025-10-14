from flask import Blueprint, request, jsonify
from database.db import get_db
import bcrypt

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    correo = data.get("correo")
    contrasena = data.get("contrasena")

    conn = get_db()
    cur = conn.cursor()
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
        return jsonify({"error": "Usuario no encontrado"}), 404

    user_id, password_db, rol = result

    # --- Caso 1: contraseña hasheada (bcrypt)
    if rol != "SuperAdmin":  # todos menos SuperAdmin usan hash
        try:
            if bcrypt.checkpw(contrasena.encode(), password_db.encode()):
                return jsonify({"usuario_id": user_id, "rol": rol})
            else:
                return jsonify({"error": "Credenciales inválidas"}), 401
        except Exception as e:
            return jsonify({"error": "Error al verificar contraseña"}), 500

    # --- Caso 2: SuperAdmin usa contraseña plana
    if rol == "SuperAdmin" and contrasena == password_db:
        return jsonify({"usuario_id": user_id, "rol": rol})

    # Si llega aquí, credenciales inválidas
    return jsonify({"error": "Credenciales inválidas"}), 401
