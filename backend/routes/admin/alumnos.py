import re
from flask import Blueprint, request, jsonify
from database.db import get_db
from utils.security import hash_password
from psycopg2.extras import RealDictCursor

# Crear el Blueprint
alumnos_bp = Blueprint("alumnos", __name__)

# ===========================
# FUNCIONES DE VALIDACIÓN
# ===========================
def validar_correo(correo, rol):
    """Valida que el correo tenga el dominio correcto según el rol"""
    dominios = {
        "Docente": "@docenteunfv.edu.pe",
        "Alumno": "@alumnounfv.edu.pe"
    }
    return correo.endswith(dominios[rol])

def validar_telefono(telefono):
    """Valida que el teléfono tenga exactamente 9 dígitos"""
    return bool(re.fullmatch(r'\d{9}', telefono))

def validar_dni(dni):
    """Valida que el DNI tenga exactamente 8 dígitos"""
    return bool(re.fullmatch(r'\d{8}', dni))

# ===========================
# CREAR ALUMNO
# ===========================
@alumnos_bp.route("/crear-alumno", methods=["POST"])
def crear_alumno():
    """
    Crea un nuevo alumno en el sistema.
    Requiere: correo, contraseña, nombres, apellidos, dni, telefono, codigo_universitario, escuela_id
    """
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

    conn = None
    cur = None

    try:
        conn = get_db()
        cur = conn.cursor()

        # 1️⃣ Insertar usuario
        cur.execute("""
            INSERT INTO usuario (correo, contrasena) 
            VALUES (%s, %s) RETURNING usuario_id
        """, (correo, contrasena))
        usuario_id = cur.fetchone()[0]

        # 2️⃣ Asignar rol de Alumno
        cur.execute("""
            INSERT INTO usuario_rol (usuario_id, rol_id)
            VALUES (%s, (SELECT rol_id FROM rol WHERE nombre_rol='Alumno'))
        """, (usuario_id,))

        # 3️⃣ Insertar datos del estudiante
        cur.execute("""
            INSERT INTO estudiante (usuario_id, nombres, apellidos, dni, telefono, codigo_universitario, escuela_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (usuario_id, nombres, apellidos, dni, telefono, codigo, escuela_id))

        conn.commit()
        return jsonify({"mensaje": "✅ Alumno creado con éxito", "usuario_id": usuario_id}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error al crear alumno: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ===========================
# LISTAR ALUMNOS
# ===========================
@alumnos_bp.route("/alumnos", methods=["GET"])
def listar_alumnos():
    """
    Obtiene la lista completa de alumnos registrados en el sistema.
    """
    conn = None
    cur = None
    
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                a.usuario_id, 
                a.nombres, 
                a.apellidos, 
                u.correo, 
                a.telefono, 
                a.dni,
                a.codigo_universitario,
                e.nombre_escuela,
                e.facultad
            FROM estudiante a
            JOIN usuario u ON a.usuario_id = u.usuario_id
            JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
            JOIN rol r ON ur.rol_id = r.rol_id
            JOIN escuela e ON a.escuela_id = e.escuela_id
            WHERE r.nombre_rol = 'Alumno'
            ORDER BY a.apellidos, a.nombres
        """)
        
        alumnos = cur.fetchall()
        return jsonify({"alumnos": alumnos}), 200
        
    except Exception as e:
        print(f"❌ Error al listar alumnos: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ===========================
# OBTENER ALUMNO POR ID
# ===========================
@alumnos_bp.route("/alumnos/<int:usuario_id>", methods=["GET"])
def obtener_alumno(usuario_id):
    """
    Obtiene los detalles completos de un alumno específico.
    """
    conn = None
    cur = None
    
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                a.usuario_id,
                u.correo,
                a.nombres,
                a.apellidos,
                a.dni,
                a.telefono,
                a.codigo_universitario,
                a.escuela_id,
                e.nombre_escuela,
                e.facultad
            FROM estudiante a
            JOIN usuario u ON a.usuario_id = u.usuario_id
            LEFT JOIN escuela e ON a.escuela_id = e.escuela_id
            WHERE a.usuario_id = %s
        """, (usuario_id,))
        
        alumno = cur.fetchone()
        
        if alumno:
            return jsonify(alumno), 200
        else:
            return jsonify({"error": "Alumno no encontrado"}), 404
            
    except Exception as e:
        print(f"❌ Error al obtener alumno: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ===========================
# MODIFICAR ALUMNO
# ===========================
@alumnos_bp.route("/alumnos/<int:usuario_id>", methods=["PUT"])
def modificar_alumno(usuario_id):
    """
    Actualiza la información de un alumno existente.
    Permite modificar: nombres, apellidos, telefono, contraseña (opcional)
    """
    data = request.json
    nombres = data.get("nombres")
    apellidos = data.get("apellidos")
    telefono = data.get("telefono")
    contrasena = data.get("contrasena")

    # Validación de teléfono
    if telefono and not validar_telefono(telefono):
        return jsonify({"error": "El teléfono debe tener exactamente 9 dígitos"}), 400

    conn = None
    cur = None

    try:
        conn = get_db()
        cur = conn.cursor()

        # 1️⃣ Verificar que el alumno existe
        cur.execute("SELECT usuario_id FROM estudiante WHERE usuario_id = %s", (usuario_id,))
        if not cur.fetchone():
            return jsonify({"error": "Alumno no encontrado"}), 404

        # 2️⃣ Actualizar contraseña si se proporciona
        if contrasena:
            contrasena_hash = hash_password(contrasena)
            cur.execute("UPDATE usuario SET contrasena=%s WHERE usuario_id=%s", (contrasena_hash, usuario_id))

        # 3️⃣ Actualizar datos del estudiante
        cur.execute("""
            UPDATE estudiante 
            SET nombres=%s, apellidos=%s, telefono=%s
            WHERE usuario_id=%s
        """, (nombres, apellidos, telefono, usuario_id))

        conn.commit()
        return jsonify({"mensaje": "✅ Alumno modificado con éxito"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error al modificar alumno: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ===========================
# ELIMINAR ALUMNO
# ===========================
@alumnos_bp.route("/alumnos/<int:usuario_id>", methods=["DELETE"])
def eliminar_alumno(usuario_id):
    """
    Elimina un alumno del sistema (eliminación completa).
    Borra primero de estudiante, luego de usuario_rol y finalmente de usuario.
    """
    conn = None
    cur = None

    try:
        conn = get_db()
        cur = conn.cursor()

        # 1️⃣ Verificar que el alumno existe
        cur.execute("SELECT usuario_id FROM estudiante WHERE usuario_id = %s", (usuario_id,))
        if not cur.fetchone():
            return jsonify({"error": "Alumno no encontrado"}), 404

        # 2️⃣ Eliminar en orden (por restricciones de FK)
        cur.execute("DELETE FROM estudiante WHERE usuario_id=%s", (usuario_id,))
        cur.execute("DELETE FROM usuario_rol WHERE usuario_id=%s", (usuario_id,))
        cur.execute("DELETE FROM usuario WHERE usuario_id=%s", (usuario_id,))

        conn.commit()
        return jsonify({"mensaje": "✅ Alumno eliminado con éxito"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error al eliminar alumno: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ===========================
# OBTENER ESCUELAS (Helper)
# ===========================
@alumnos_bp.route("/escuelas", methods=["GET"])
def obtener_escuelas():
    """
    Obtiene la lista de todas las escuelas disponibles.
    Usado para formularios de creación/edición de alumnos.
    """
    conn = None
    cur = None
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("SELECT escuela_id, nombre_escuela, facultad FROM ESCUELA ORDER BY nombre_escuela")
        escuelas = cur.fetchall()
        
        return jsonify({
            "escuelas": [
                {
                    "escuela_id": row[0],
                    "nombre_escuela": row[1],
                    "facultad": row[2]
                } for row in escuelas
            ]
        }), 200
        
    except Exception as e:
        print(f"❌ Error al obtener escuelas: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()