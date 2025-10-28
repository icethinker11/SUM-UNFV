import re
from flask import Blueprint, request, jsonify
from database.db import get_db
from utils.security import hash_password
from psycopg2.extras import RealDictCursor

docentes_bp = Blueprint('docentes', __name__)

# ===========================
# FUNCIONES DE VALIDACIÓN
# ===========================
def validar_correo_docente(correo):
    return correo.endswith("@docenteunfv.edu.pe")

def validar_telefono(telefono):
    return bool(re.fullmatch(r'\d{9}', telefono))

def validar_dni(dni):
    return bool(re.fullmatch(r'\d{8}', dni))

# ===========================
# CREAR DOCENTE
# ===========================
@docentes_bp.route("/crear-docente", methods=["POST"])
def crear_docente():
    data = request.json
    correo = data.get("correo")
    contrasena = hash_password(data.get("contrasena"))
    nombres = data.get("nombres")
    apellidos = data.get("apellidos")
    dni = data.get("dni")
    telefono = data.get("telefono")
    escuela_id = data.get("escuela_id")

    # Validaciones
    if not validar_correo_docente(correo):
        return jsonify({"error": "El correo debe terminar en @docenteunfv.edu.pe"}), 400
    if not validar_telefono(telefono):
        return jsonify({"error": "El teléfono debe tener exactamente 9 dígitos"}), 400
    if not validar_dni(dni):
        return jsonify({"error": "El DNI debe tener exactamente 8 dígitos"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO usuario (correo, contrasena) 
            VALUES (%s, %s) RETURNING usuario_id
        """, (correo, contrasena))
        usuario_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO usuario_rol (usuario_id, rol_id)
            VALUES (%s, (SELECT rol_id FROM rol WHERE nombre_rol='Docente'))
        """, (usuario_id,))

        cur.execute("""
            INSERT INTO docente (usuario_id, nombres, apellidos, dni, telefono, escuela_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (usuario_id, nombres, apellidos, dni, telefono, escuela_id))

        conn.commit()
        return jsonify({"mensaje": "Docente creado con éxito ✅", "usuario_id": usuario_id}), 201
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error al crear docente: {e}")
        return jsonify({"error": "Error interno al crear docente"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ==========================
# LISTAR DOCENTES
# ==========================
@docentes_bp.route("/docentes", methods=["GET"])
def listar_docentes():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT 
                d.usuario_id, 
                d.nombres, 
                d.apellidos, 
                d.dni,
                u.correo, 
                d.telefono, 
                e.nombre_escuela
            FROM docente d
            JOIN usuario u ON d.usuario_id = u.usuario_id
            JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
            JOIN rol r ON ur.rol_id = r.rol_id
            JOIN escuela e ON d.escuela_id = e.escuela_id
            WHERE r.nombre_rol = 'Docente'
            ORDER BY d.nombres ASC
        """)
        docentes = cur.fetchall()
        return jsonify(docentes), 200
        
    except Exception as e:
        print(f"❌ Error al listar docentes: {e}")
        return jsonify({"error": "Error interno al listar docentes"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ===========================
# MODIFICAR DOCENTE
# ===========================
@docentes_bp.route("/docentes/<int:usuario_id>", methods=["PUT"])
def modificar_docente(usuario_id):
    data = request.json
    nombres = data.get("nombres")
    apellidos = data.get("apellidos")
    telefono = data.get("telefono")
    contrasena = data.get("contrasena")

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Actualizar datos del docente
        cur.execute("""
            UPDATE docente 
            SET nombres=%s, apellidos=%s, telefono=%s
            WHERE usuario_id=%s
        """, (nombres, apellidos, telefono, usuario_id))

        # Si mandan nueva contraseña, actualizarla
        if contrasena:
            hashed = hash_password(contrasena)
            cur.execute("""
                UPDATE usuario 
                SET contrasena=%s 
                WHERE usuario_id=%s
            """, (hashed, usuario_id))

        conn.commit()
        return jsonify({"mensaje": "Docente actualizado correctamente ✅"}), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error al modificar docente: {e}")
        return jsonify({"error": "Error interno al modificar docente"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ===========================
# ELIMINAR DOCENTE
# ===========================
@docentes_bp.route("/docentes/<int:usuario_id>", methods=["DELETE"])
def eliminar_docente(usuario_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Eliminar en orden: docente, usuario_rol, usuario
        cur.execute("DELETE FROM docente WHERE usuario_id=%s", (usuario_id,))
        cur.execute("DELETE FROM usuario_rol WHERE usuario_id=%s", (usuario_id,))
        cur.execute("DELETE FROM usuario WHERE usuario_id=%s", (usuario_id,))
        
        conn.commit()
        return jsonify({"mensaje": "Docente eliminado con éxito ✅"}), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error al eliminar docente: {e}")
        return jsonify({"error": "Error interno al eliminar docente"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()