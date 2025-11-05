# ============================================
# perfil_routes.py – Rutas del perfil docente (versión integrada con docentes_bp)
# ============================================

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db
from .models import AuditoriaDocente
import traceback
from psycopg2.extras import RealDictCursor


# 👇 Importa el blueprint principal del módulo docentes
from . import docentes_bp

# =========================================================
# 🔹 Función auxiliar: registrar auditoría
# =========================================================
def registrar_auditoria(docente_id, accion, tabla_afectada, registro_id=None, detalles=None):
    try:
        ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        AuditoriaDocente.registrar(
            docente_id=docente_id,
            accion=accion,
            tabla_afectada=tabla_afectada,
            registro_id=registro_id,
            detalles=detalles,
            ip_address=ip
        )
    except Exception:
        print("⚠️ Error registrando auditoría:")
        print(traceback.format_exc())

# =========================================================
# 🔹 [GET] Obtener perfil del docente (versión corregida)
# =========================================================
@docentes_bp.route("/perfil/<int:usuario_id>", methods=["GET"])
def obtener_perfil_docente(usuario_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT 
                u.usuario_id,
                p.nombres,
                p.apellidos,
                p.dni,
                p.telefono,
                p.fecha_nacimiento,
                u.correo,
                d.direccion_detalle AS direccion,
                dist.nombre_distrito AS distrito,
                e.nombre_escuela AS escuela,
                doc.codigo_docente
            FROM usuario u
            JOIN persona p ON u.usuario_id = p.usuario_id
            JOIN docente doc ON p.persona_id = doc.persona_id
            LEFT JOIN direccion d ON doc.id_direccion = d.id_direccion
            LEFT JOIN distrito dist ON d.id_distrito = dist.distrito_id
            LEFT JOIN escuela e ON doc.escuela_id = e.escuela_id
            WHERE u.usuario_id = %s
        """, (usuario_id,))

        perfil = cur.fetchone()

        if not perfil:
            return jsonify({"error": "Docente no encontrado"}), 404

        return jsonify(perfil), 200

    except Exception as e:
        print("❌ Error en obtener_perfil_docente:", e)
        return jsonify({"error": "Error al obtener el perfil."}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================================================
# 🔹 [PUT] Actualizar perfil del docente
# =========================================================
@docentes_bp.route("/perfil/<int:usuario_id>", methods=["PUT"])
def actualizar_perfil_docente(usuario_id):
    print(f"\n✏️ Actualizando perfil del docente ID: {usuario_id}")
    data = request.get_json()

    try:
        nombres = data.get("nombres")
        apellidos = data.get("apellidos")
        correo = data.get("correo")
        telefono = data.get("telefono")
        direccion = data.get("direccion")
        id_distrito = data.get("id_distrito")

        if not all([nombres, apellidos, correo, telefono, direccion]):
            return jsonify({"error": "Todos los campos son obligatorios"}), 400

        conn = get_db()
        cur = conn.cursor()

        # Actualizar persona
        cur.execute("""
            UPDATE persona 
            SET nombres=%s, apellidos=%s, telefono=%s 
            WHERE usuario_id=%s
        """, (nombres, apellidos, telefono, usuario_id))

        # Actualizar correo
        cur.execute("""
            UPDATE usuario 
            SET correo=%s
            WHERE usuario_id=%s
        """, (correo, usuario_id))

        # Actualizar dirección
        if id_distrito:
            cur.execute("""
                UPDATE direccion 
                SET direccion_detalle=%s, id_distrito=%s
                WHERE id_direccion = (
                    SELECT doc.id_direccion 
                    FROM docente doc
                    JOIN persona p ON doc.persona_id = p.persona_id
                    WHERE p.usuario_id = %s
                )
            """, (direccion, id_distrito, usuario_id))
        else:
            cur.execute("""
                UPDATE direccion 
                SET direccion_detalle=%s
                WHERE id_direccion = (
                    SELECT doc.id_direccion 
                    FROM docente doc
                    JOIN persona p ON doc.persona_id = p.persona_id
                    WHERE p.usuario_id = %s
                )
            """, (direccion, usuario_id))

        conn.commit()
        registrar_auditoria(usuario_id, "actualizar_perfil", "usuario", usuario_id)
        return jsonify({"mensaje": "Perfil actualizado correctamente"}), 200

    except Exception:
        if 'conn' in locals():
            conn.rollback()
        print("❌ ERROR al actualizar perfil:")
        print(traceback.format_exc())
        return jsonify({"error": "Error interno al actualizar perfil"}), 500

    finally:
        if 'cur' in locals():
            cur.close()
        print("🔚 Conexión cerrada.\n")

# =========================================================
# 🔹 [PUT] Cambiar contraseña del docente
# =========================================================
@docentes_bp.route("/perfil/cambiar-password", methods=["PUT"])
@jwt_required()
def cambiar_password():
    print("\n🔐 Solicitud para cambiar contraseña.")
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()
        print("📤 Datos recibidos:", data)

        password_actual = data.get("password_actual")
        password_nueva = data.get("password_nueva")

        if not password_actual or not password_nueva:
            return jsonify({"error": "Faltan campos requeridos"}), 400

        conn = get_db()
        cur = conn.cursor()

        # Obtener hash actual
        cur.execute("SELECT contrasena FROM usuario WHERE usuario_id = %s", (usuario_id,))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Usuario no encontrado"}), 404

        contrasena_hash = result[0]
        if not check_password_hash(contrasena_hash, password_actual):
            return jsonify({"error": "Contraseña actual incorrecta"}), 401

        nueva_hash = generate_password_hash(password_nueva)

        # Actualizar
        cur.execute("""
            UPDATE usuario SET contrasena = %s WHERE usuario_id = %s
        """, (nueva_hash, usuario_id))
        conn.commit()

        registrar_auditoria(usuario_id, "cambiar_password", "usuario", usuario_id)
        return jsonify({"mensaje": "Contraseña actualizada correctamente"}), 200

    except Exception:
        if 'conn' in locals():
            conn.rollback()
        print("❌ ERROR al cambiar contraseña:")
        print(traceback.format_exc())
        return jsonify({"error": "Error interno al cambiar contraseña"}), 500

    finally:
        if 'cur' in locals():
            cur.close()
        print("🔚 Conexión cerrada.\n")
