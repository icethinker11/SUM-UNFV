# admin_routes.py
import re
from flask import Blueprint, request, jsonify
from database.db import get_db
from utils.security import hash_password
from psycopg2.extras import RealDictCursor


admin_bp = Blueprint("admin", __name__)

# ===========================
# FUNCIONES DE VALIDACIÓN
# ===========================
def validar_correo(correo, rol):
    dominios = {
        "Docente": "@docenteunfv.edu.pe",
        "Alumno": "@alumnounfv.edu.pe"
    }
    return correo.endswith(dominios[rol])

def validar_telefono(telefono):
    return bool(re.fullmatch(r'\d{9}', telefono))

def validar_dni(dni):
    return bool(re.fullmatch(r'\d{8}', dni))

# ===========================
# CREAR DOCENTE
# ===========================
@admin_bp.route("/crear-docente", methods=["POST"])
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
    if not validar_correo(correo, "Docente"):
        return jsonify({"error": "El correo debe terminar en @docenteunfv.edu.pe"}), 400
    if not validar_telefono(telefono):
        return jsonify({"error": "El teléfono debe tener exactamente 9 dígitos"}), 400
    if not validar_dni(dni):
        return jsonify({"error": "El DNI debe tener exactamente 8 dígitos"}), 400

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
    cur.close()
    return jsonify({"mensaje": "Docente creado con éxito", "usuario_id": usuario_id})


# ===========================
# CREAR ALUMNO
# ===========================
@admin_bp.route("/crear-alumno", methods=["POST"])
def crear_alumno():
    data = request.json
    correo = data.get("correo")
    contrasena = hash_password(data.get("contrasena"))
    nombres = data.get("nombres")
    apellidos = data.get("apellidos")
    dni = data.get("dni")
    telefono = data.get("telefono")
    codigo = data.get("codigo_universitario")
    escuela_id = data.get("escuela_id")

    # Validaciones
    if not validar_correo(correo, "Alumno"):
        return jsonify({"error": "El correo debe terminar en @alumnounfv.edu.pe"}), 400
    if not validar_telefono(telefono):
        return jsonify({"error": "El teléfono debe tener exactamente 9 dígitos"}), 400
    if not validar_dni(dni):
        return jsonify({"error": "El DNI debe tener exactamente 8 dígitos"}), 400

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO usuario (correo, contrasena) 
        VALUES (%s, %s) RETURNING usuario_id
    """, (correo, contrasena))
    usuario_id = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO usuario_rol (usuario_id, rol_id)
        VALUES (%s, (SELECT rol_id FROM rol WHERE nombre_rol='Alumno'))
    """, (usuario_id,))

    cur.execute("""
        INSERT INTO estudiante (usuario_id, nombres, apellidos, dni, telefono, codigo_universitario, escuela_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (usuario_id, nombres, apellidos, dni, telefono, codigo, escuela_id))

    conn.commit()
    cur.close()
    return jsonify({"mensaje": "Alumno creado con éxito", "usuario_id": usuario_id})


@admin_bp.route("/escuelas", methods=["GET"])
def obtener_escuelas():
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("SELECT escuela_id, nombre_escuela, facultad FROM ESCUELA ORDER BY nombre_escuela")
        escuelas = cur.fetchall()
        
        cur.close()
        
        return jsonify({
            "escuelas": [
                {
                    "escuela_id": row[0],
                    "nombre_escuela": row[1],
                    "facultad": row[2]
                } for row in escuelas
            ]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================
# LISTAR DOCENTES
# ==========================
@admin_bp.route("/docentes", methods=["GET"])
def listar_docentes():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
    SELECT d.usuario_id, d.nombres, d.apellidos, u.correo, d.telefono, e.nombre_escuela
    FROM docente d
    JOIN usuario u ON d.usuario_id = u.usuario_id
    JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.rol_id
    JOIN escuela e ON d.escuela_id = e.escuela_id
    WHERE r.nombre_rol = 'Docente'
""")
    docentes = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(docentes)


# ==========================
# LISTAR ALUMNOS
# ==========================
@admin_bp.route("/alumnos", methods=["GET"])
def listar_alumnos():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
    SELECT a.usuario_id, a.nombres, a.apellidos, u.correo, a.telefono, e.nombre_escuela
    FROM estudiante a
    JOIN usuario u ON a.usuario_id = u.usuario_id
    JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.rol_id
    JOIN escuela e ON a.escuela_id = e.escuela_id
    WHERE r.nombre_rol = 'Alumno'
""")
    alumnos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(alumnos)


# ===========================
# MODIFICAR DOCENTE
# ===========================
@admin_bp.route("/docentes/<int:docente_id>", methods=["PUT"])
def modificar_docente(docente_id):
    data = request.json
    nombres = data.get("nombres")
    apellidos = data.get("apellidos", "")  # si no viene, por defecto vacío
    correo = data.get("correo")
    contrasena = data.get("contrasena")

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if contrasena:  # si mandan nueva contraseña, la hasheamos
        hashed = bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cur.execute("""
            UPDATE docente 
            SET nombres=%s, apellidos=%s, correo=%s, contrasena=%s
            WHERE usuario_id=%s
            RETURNING *;
        """, (nombres, apellidos, correo, hashed, docente_id))
    else:  # si no cambian contraseña, no tocarla
        cur.execute("""
            UPDATE docente 
            SET nombres=%s, apellidos=%s, correo=%s
            WHERE usuario_id=%s
            RETURNING *;
        """, (nombres, apellidos, correo, docente_id))

    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return jsonify(updated), 200


# ===========================
# ELIMINAR DOCENTE
# ===========================
@admin_bp.route("/docentes/<int:usuario_id>", methods=["DELETE"])
def eliminar_docente(usuario_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM docente WHERE usuario_id=%s", (usuario_id,))
    cur.execute("DELETE FROM usuario WHERE usuario_id=%s", (usuario_id,))
    conn.commit()
    cur.close()
    return jsonify({"mensaje": "Docente eliminado con éxito"})


# ===========================
# MODIFICAR ALUMNO
# ===========================
@admin_bp.route("/alumnos/<int:usuario_id>", methods=["PUT"])
def modificar_alumno(usuario_id):
    data = request.json
    nombres = data.get("nombres")
    apellidos = data.get("apellidos")
    telefono = data.get("telefono")
    contrasena = data.get("contrasena")

    conn = get_db()
    cur = conn.cursor()

    if contrasena:
        contrasena = hash_password(contrasena)
        cur.execute("UPDATE usuario SET contrasena=%s WHERE usuario_id=%s", (contrasena, usuario_id))

    cur.execute("""
        UPDATE estudiante SET nombres=%s, apellidos=%s, telefono=%s
        WHERE usuario_id=%s
    """, (nombres, apellidos, telefono, usuario_id))

    conn.commit()
    cur.close()
    return jsonify({"mensaje": "Alumno modificado con éxito"})


# ===========================
# ELIMINAR ALUMNO
# ===========================
@admin_bp.route("/alumnos/<int:usuario_id>", methods=["DELETE"])
def eliminar_alumno(usuario_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM estudiante WHERE usuario_id=%s", (usuario_id,))
    cur.execute("DELETE FROM usuario WHERE usuario_id=%s", (usuario_id,))
    conn.commit()
    cur.close()
    return jsonify({"mensaje": "Alumno eliminado con éxito"})

