# routes/superadmin_routes.py
# -*- coding: utf-8 -*-
import re
import random
import string
from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
from database.db import get_db
from utils.security import hash_password
from flask_mail import Message
from extensions import mail 

superadmin_bp = Blueprint('superadmin_bp', __name__, url_prefix='/superadmin')

# ======================================================
# 🧩 FUNCIONES AUXILIARES
# ======================================================

def generar_correo_institucional(nombres, apellidos):
    partes_nombre = (nombres or "").strip().split()
    partes_apellido = (apellidos or "").strip().split()
    inicial_nombre = partes_nombre[0][0].lower() if partes_nombre else ""
    primer_apellido = partes_apellido[0].lower() if partes_apellido else ""
    inicial_segundo_apellido = partes_apellido[1][0].lower() if len(partes_apellido) > 1 else ""
    return f"{inicial_nombre}{primer_apellido}{inicial_segundo_apellido}@unfv.edu.pe"

def generar_contrasena(longitud=10):
    caracteres = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(caracteres) for _ in range(longitud))

def validar_telefono(telefono):
    return bool(re.fullmatch(r"\d{9}", (telefono or "")))

def validar_dni(dni):
    return bool(re.fullmatch(r"\d{8}", (dni or "")))

def enviar_credenciales(correo_destino, correo_institucional, contrasena):
    try:
        msg = Message(
            subject="Credenciales de acceso - Sistema UNFV",
            recipients=[correo_destino],
            body=(
                f"¡Bienvenido al sistema UNFV!\n\n"
                f"Correo institucional: {correo_institucional}\n"
                f"Contraseña: {contrasena}\n\n"
                "Por favor cambia tu contraseña después de iniciar sesión."
            )
        )
        mail.send(msg)
        print(f"✅ Correo enviado correctamente a {correo_destino}")
        return True
    except Exception as e:
        print("❌ Error al enviar correo:", str(e))
        return False

# ======================================================
# 🧱 CREAR ADMINISTRADOR
# ======================================================
@superadmin_bp.route("/crear-admin", methods=["POST"])
def crear_admin():
    data = request.json
    nombres = data.get("nombres")
    apellidos = data.get("apellidos")
    dni = data.get("dni")
    telefono = data.get("telefono")
    correo_personal = data.get("correo_personal")
    direccion_detalle = data.get("direccion_detalle")
    distrito_id = data.get("distrito_id")
    fecha_nacimiento = data.get("fecha_nacimiento")
    id_formacion = data.get("id_formacion")
    id_especialidad = data.get("id_especialidad")
    experiencia_lab = data.get("experiencia_lab")
    escuela_id = data.get("escuela_id")

    if not nombres or not apellidos or not dni or not telefono:
        return jsonify({"error": "Faltan campos obligatorios"}), 400
    if not validar_dni(dni):
        return jsonify({"error": "El DNI debe tener 8 dígitos"}), 400
    if not validar_telefono(telefono):
        return jsonify({"error": "El teléfono debe tener 9 dígitos"}), 400

    correo_institucional = generar_correo_institucional(nombres, apellidos)
    contrasena_generada = generar_contrasena()
    contrasena_hash = hash_password(contrasena_generada)

    conn = get_db()
    cur = conn.cursor()

    # Crear usuario
    cur.execute(
        "INSERT INTO usuario (correo, contrasena) VALUES (%s, %s) RETURNING usuario_id",
        (correo_institucional, contrasena_hash),
    )
    usuario_id = cur.fetchone()[0]

    # Asignar rol Admin
    cur.execute(
        "INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (%s, (SELECT rol_id FROM rol WHERE nombre_rol='Admin'))",
        (usuario_id,),
    )

    # Insertar administrador
    cur.execute("""
        INSERT INTO administrador (
            usuario_id, nombres, apellidos, dni, telefono, direccion_detalle,
            distrito_id, fecha_nacimiento, id_formacion, id_especialidad,
            experiencia_lab, escuela_id, estado
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'Activo')
    """, (
        usuario_id, nombres, apellidos, dni, telefono, direccion_detalle,
        distrito_id, fecha_nacimiento, id_formacion, id_especialidad,
        experiencia_lab, escuela_id
    ))

    conn.commit()
    cur.close()
    conn.close()

    enviar_credenciales(correo_personal, correo_institucional, contrasena_generada)
    return jsonify({"mensaje": f"Administrador creado exitosamente. Credenciales enviadas a {correo_personal}."})


# ======================================================
# 📋 LISTAR ADMINISTRADORES
# ======================================================
@superadmin_bp.route("/admins", methods=["GET"])
def listar_admins():
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT 
                u.usuario_id, 
                a.nombres, 
                a.apellidos, 
                a.dni, 
                a.telefono, 
                a.direccion_detalle,
                d.distrito_id,
                d.nombre_distrito,
                f.id_formacion,
                f.nombre_formacion,
                e.id_especialidad,
                e.nombre_especialidad,
                a.experiencia_lab,
                es.escuela_id,
                es.nombre_escuela,
                u.correo, 
                a.estado
            FROM usuario u
            JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
            JOIN rol r ON ur.rol_id = r.rol_id
            JOIN administrador a ON u.usuario_id = a.usuario_id
            LEFT JOIN distrito d ON a.distrito_id = d.distrito_id
            LEFT JOIN formacion f ON a.id_formacion = f.id_formacion
            LEFT JOIN especialidad e ON a.id_especialidad = e.id_especialidad
            LEFT JOIN escuela es ON a.escuela_id = es.escuela_id
            WHERE r.nombre_rol = 'Admin'
            ORDER BY a.nombres ASC
        """)
        admins = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"admins": admins})
    except Exception as e:
        print("Error al listar admins:", str(e))
        return jsonify({"error": "Error al listar administradores"}), 500


# ======================================================
# ✏️ MODIFICAR ADMINISTRADOR
# ======================================================
@superadmin_bp.route("/admins/<int:usuario_id>", methods=["PUT"])
def modificar_admin(usuario_id):
    try:
        data = request.json
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            UPDATE administrador
            SET nombres = %s,
                apellidos = %s,
                dni = %s,
                telefono = %s,
                direccion_detalle = %s,
                distrito_id = %s,
                fecha_nacimiento = %s,
                id_formacion = %s,
                id_especialidad = %s,
                experiencia_lab = %s,
                escuela_id = %s,
                estado = %s
            WHERE usuario_id = %s
        """, (
            data.get("nombres"),
            data.get("apellidos"),
            data.get("dni"),
            data.get("telefono"),
            data.get("direccion_detalle"),
            data.get("distrito_id"),
            data.get("fecha_nacimiento"),
            data.get("id_formacion"),
            data.get("id_especialidad"),
            data.get("experiencia_lab"),
            data.get("escuela_id"),
            data.get("estado"),
            usuario_id
        ))

        if "correo" in data and data["correo"]:
            cur.execute("UPDATE usuario SET correo = %s WHERE usuario_id = %s", 
                        (data["correo"], usuario_id))

        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"mensaje": "Administrador actualizado correctamente ✅"})

    except Exception as e:
        print("❌ Error al modificar administrador:", str(e))
        return jsonify({"error": "Error al actualizar administrador"}), 500

# ======================================================
# ❌ ELIMINAR ADMINISTRADOR
# ======================================================
@superadmin_bp.route("/admins/<int:usuario_id>", methods=["DELETE"])
def eliminar_admin(usuario_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM administrador WHERE usuario_id = %s", (usuario_id,))
        cur.execute("DELETE FROM usuario_rol WHERE usuario_id = %s", (usuario_id,))
        cur.execute("DELETE FROM usuario WHERE usuario_id = %s", (usuario_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"mensaje": "Administrador eliminado correctamente"})
    except Exception as e:
        print("Error al eliminar admin:", e)
        return jsonify({"error": "Error al eliminar administrador"}), 500

# ======================================================
# 🔄 CAMBIAR ESTADO (Activo/Inactivo)
# ======================================================
@superadmin_bp.route("/admins/<int:usuario_id>/estado", methods=["PATCH"])
def cambiar_estado_admin(usuario_id):
    data = request.json
    nuevo_estado = data.get("estado")
    if nuevo_estado not in ["Activo", "Inactivo"]:
        return jsonify({"error": "Estado inválido"}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE administrador SET estado=%s WHERE usuario_id=%s", (nuevo_estado, usuario_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"mensaje": f"Estado actualizado a {nuevo_estado}"})


# ======================================================
# 🌆 LISTAR DISTRITOS
# ======================================================
@superadmin_bp.route('/distritos', methods=['GET'])
def obtener_distritos():
    """Obtiene la lista de distritos registrados en la base de datos."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT distrito_id, nombre_distrito FROM distrito ORDER BY nombre_distrito ASC;")
        distritos = [
            {"distrito_id": row[0], "nombre_distrito": row[1]}
            for row in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return jsonify({"distritos": distritos})

    except Exception as e:
        import traceback
        print("❌ Error al obtener distritos:", str(e))
        print(traceback.format_exc())  # 🔍 muestra la traza completa del error en consola
        return jsonify({
            "error": "Error interno al obtener distritos.",
            "detalle": str(e)
        }), 500


# ======================================================
# 🏫 LISTAR ESCUELAS
# ======================================================
@superadmin_bp.route('/escuelas', methods=['GET'])
def obtener_escuelas():
    """Obtiene la lista de escuelas registradas en la base de datos."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT escuela_id, nombre_escuela FROM escuela ORDER BY nombre_escuela ASC;")
        escuelas = [
            {"escuela_id": row[0], "nombre_escuela": row[1]}
            for row in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return jsonify({"escuelas": escuelas})

    except Exception as e:
        import traceback
        print("❌ Error al obtener escuelas:", str(e))
        print(traceback.format_exc())  # 🔍 muestra el detalle técnico exacto
        return jsonify({
            "error": "Error interno al obtener escuelas.",
            "detalle": str(e)
        }), 500
# ======================================================
# 🎓 LISTAR FORMACIONES
# ======================================================
@superadmin_bp.route('/formaciones', methods=['GET'])
def obtener_formaciones():
    """Obtiene la lista de formaciones registradas en la base de datos."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id_formacion, nombre_formacion FROM formacion ORDER BY nombre_formacion ASC;")
        formaciones = [
            {"id_formacion": row[0], "nombre_formacion": row[1]}
            for row in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return jsonify({"formaciones": formaciones})

    except Exception as e:
        import traceback
        print("❌ Error al obtener formaciones:", str(e))
        print(traceback.format_exc())
        return jsonify({
            "error": "Error interno al obtener formaciones.",
            "detalle": str(e)
        }), 500


# ======================================================
# 🏢 LISTAR ESPECIALIDADES
# ======================================================
@superadmin_bp.route('/especialidades', methods=['GET'])
def obtener_especialidades():
    """Obtiene la lista de especialidades registradas en la base de datos."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id_especialidad, nombre_especialidad FROM especialidad ORDER BY nombre_especialidad ASC;")
        especialidades = [
            {"id_especialidad": row[0], "nombre_especialidad": row[1]}
            for row in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return jsonify({"especialidades": especialidades})

    except Exception as e:
        import traceback
        print("❌ Error al obtener especialidades:", str(e))
        print(traceback.format_exc())
        return jsonify({
            "error": "Error interno al obtener especialidades.",
            "detalle": str(e)
        }), 500
    
# ======================================================
# 📚 LISTAR TODOS LOS CURSOS (Necesaria para los Dropdowns de Prerrequisitos)
# ======================================================
@superadmin_bp.route('/cursos', methods=['GET'])
def obtener_cursos():
    """Obtiene la lista de todos los cursos para ser usados en selectores."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor) 
        
        cur.execute("""
            SELECT 
                curso_id AS id_curso, 
                nombre AS nombre_curso, 
                codigo AS codigo_curso 
            FROM curso 
            ORDER BY nombre_curso ASC;
        """)
        
        cursos = cur.fetchall()
        return jsonify({"cursos": cursos}), 200

    except Exception as e:
        print("❌ Error al obtener cursos:", str(e))
        return jsonify({
            "error": "Error interno al obtener cursos.",
            "detalle": str(e)
        }), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# DEFINIR PRERREQUISITOS
# ======================================================
@superadmin_bp.route("/definir-prerrequisito", methods=["POST"])
def definir_prerrequisito():
    """Permite al SuperAdmin registrar un prerrequisito de un curso."""
    data = request.json
    id_curso = data.get("id_curso")
    id_curso_requerido = data.get("id_curso_requerido")

    if not id_curso or not id_curso_requerido:
        return jsonify({"error": "Debe indicar id_curso e id_curso_requerido"}), 400
    if id_curso == id_curso_requerido:
        return jsonify({"error": "Un curso no puede ser prerrequisito de sí mismo"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Verificar existencia de ambos cursos y evitar duplicados (código omitido)

        cur.execute("""
            INSERT INTO prerrequisito (id_curso, id_curso_requerido)
            VALUES (%s, %s)
        """, (id_curso, id_curso_requerido))

        conn.commit()

        return jsonify({"mensaje": "Prerrequisito definido correctamente"}), 201

    except psycopg2.Error as e:
        print("❌ Error de DB:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# LISTAR PRERREQUISITOS
# ======================================================
@superadmin_bp.route("/prerrequisitos/<int:id_curso>", methods=["GET"])
def listar_prerrequisitos(id_curso):
    """Lista los prerrequisitos de un curso específico."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT p.id_prerrequisito, p.id_curso_requerido, c.nombre AS curso_requerido
            FROM prerrequisito p
            JOIN curso c ON p.id_curso_requerido = c.curso_id
            WHERE p.id_curso = %s
            ORDER BY c.nombre
        """, (id_curso,))

        prerrequisitos = cur.fetchall()

        return jsonify(prerrequisitos), 200

    except psycopg2.Error as e:
        print("❌ Error de DB:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# ELIMINAR PRERREQUISITO
# ======================================================
@superadmin_bp.route("/prerrequisitos/<int:id_prerrequisito>", methods=["DELETE"])
def eliminar_prerrequisito(id_prerrequisito):
    """Permite al SuperAdmin eliminar un prerrequisito registrado."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("DELETE FROM prerrequisito WHERE id_prerrequisito = %s", (id_prerrequisito,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "El prerrequisito no existe"}), 404

        conn.commit()

        return jsonify({"mensaje": "Prerrequisito eliminado correctamente"}), 200

    except psycopg2.Error as e:
        print("❌ Error de DB:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


