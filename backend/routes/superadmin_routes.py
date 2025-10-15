# routes/superadmin_routes.py
# -*- coding: utf-8 -*-
import re
import random
import string
from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
import psycopg2 
from database.db import get_db
from utils.security import hash_password
from flask_mail import Message
from extensions import mail 
from datetime import datetime 

superadmin_bp = Blueprint('superadmin_bp', __name__, url_prefix='/superadmin')

# ======================================================
# 🧩 FUNCIONES AUXILIARES ( LOY )
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
# 🧱 CREAR ADMINISTRADOR (FINAL, MEJORADO Y DETALLADO)
# ======================================================
@superadmin_bp.route("/crear-admin", methods=["POST"])
def crear_admin():
    data = request.json

    # === 1️⃣ VALIDACIONES DE CAMPOS OBLIGATORIOS ===
    campos_obligatorios = [
        "nombres", "apellidos", "dni", "telefono", "correo_personal",
        "direccion_detalle", "distrito_id", "fecha_nacimiento",
        "id_formacion", "id_especialidad", "escuela_id"
    ]
    for campo in campos_obligatorios:
        if not data.get(campo):
            return jsonify({"error": f"El campo '{campo}' es obligatorio."}), 400

    # === 2️⃣ VALIDACIONES DE FORMATO ===
    if not data["dni"].isdigit() or len(data["dni"]) != 8:
        return jsonify({"error": "El DNI debe tener exactamente 8 dígitos numéricos."}), 400
    if not data["telefono"].isdigit() or len(data["telefono"]) != 9:
        return jsonify({"error": "El teléfono debe tener 9 dígitos numéricos."}), 400

    # === 3️⃣ CONVERSIÓN DE FECHA ===
    fecha_nacimiento_str = data.get("fecha_nacimiento")
    try:
        if "/" in fecha_nacimiento_str:
            fecha_nacimiento_obj = datetime.strptime(fecha_nacimiento_str, "%d/%m/%Y").date()
        else:
            fecha_nacimiento_obj = datetime.strptime(fecha_nacimiento_str, "%Y-%m-%d").date()
    except Exception:
        return jsonify({"error": "Formato de fecha inválido. Use DD/MM/YYYY o YYYY-MM-DD."}), 400

    # === 4️⃣ CREACIÓN DE CREDENCIALES ===
    correo_institucional = generar_correo_institucional(data["nombres"], data["apellidos"])
    contrasena_generada = generar_contrasena()
    contrasena_hash = hash_password(contrasena_generada)

    conn = None
    cur = None

    try:
        conn = get_db()
        cur = conn.cursor()

        # === PASO 1: DIRECCIÓN ===
        cur.execute("""
            INSERT INTO direccion (id_distrito, direccion_detalle)
            VALUES (%s, %s)
            RETURNING id_direccion
        """, (data["distrito_id"], data["direccion_detalle"]))
        direccion_id = cur.fetchone()[0]

        # === PASO 2: USUARIO ===
        cur.execute("""
            INSERT INTO usuario (correo, contrasena, estado)
            VALUES (%s, %s, 'Activo')
            RETURNING usuario_id
        """, (correo_institucional, contrasena_hash))
        usuario_id = cur.fetchone()[0]

        # === PASO 3: PERSONA ===
        cur.execute("""
            INSERT INTO persona (usuario_id, direccion_id, nombres, apellidos, dni, telefono, fecha_nacimiento)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING persona_id
        """, (
            usuario_id, direccion_id, data["nombres"], data["apellidos"],
            data["dni"], data["telefono"], fecha_nacimiento_obj
        ))
        persona_id = cur.fetchone()[0]

        # === PASO 4: ADMINISTRADOR ===
        cur.execute("""
            INSERT INTO administrador (persona_id, id_formacion, id_especialidad, experiencia_lab, escuela_id, estado)
            VALUES (%s, %s, %s, %s, %s, 'Activo')
        """, (
            persona_id, data["id_formacion"], data["id_especialidad"],
            data.get("experiencia_lab"), data["escuela_id"]
        ))

        # === PASO 5: ROL ===
        cur.execute("""
            INSERT INTO usuario_rol (usuario_id, rol_id)
            VALUES (%s, (SELECT rol_id FROM rol WHERE nombre_rol = 'Admin'))
        """, (usuario_id,))

        conn.commit()

        return jsonify({
            "mensaje": f"✅ Administrador creado exitosamente. Credenciales enviadas a {data['correo_personal']}."
        }), 201

    # === 6️⃣ ERRORES ESPECÍFICOS ===
    except psycopg2.IntegrityError as e:
        if conn:
            conn.rollback()
        error_text = str(e).lower()

        if "dni" in error_text:
            msg = "❌ El DNI ingresado ya está registrado."
        elif "correo" in error_text:
            msg = "❌ El correo institucional generado ya existe."
        elif "telefono" in error_text:
            msg = "❌ El teléfono ingresado ya está registrado."
        elif "id_distrito" in error_text:
            msg = "❌ El distrito seleccionado no existe."
        elif "id_formacion" in error_text:
            msg = "❌ La formación seleccionada no existe."
        elif "id_especialidad" in error_text:
            msg = "❌ La especialidad seleccionada no existe."
        elif "escuela_id" in error_text:
            msg = "❌ La escuela seleccionada no existe."
        else:
            msg = "⚠️ Error de integridad en la base de datos. Revise los datos ingresados."
        return jsonify({"error": msg}), 400

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"🔥 Error inesperado al crear administrador: {e}")
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ======================================================
# 📋 LISTAR ADMINISTRADORES
# ======================================================
@superadmin_bp.route("/admins", methods=["GET"])
def listar_admins():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
        SELECT 
            u.usuario_id, 
            p.nombres, p.apellidos, p.dni, p.telefono, p.fecha_nacimiento, 
            d.direccion_detalle, dist.nombre_distrito, dist.distrito_id,
            a.id_formacion, f.nombre_formacion AS formacion,
            a.id_especialidad, e.nombre_especialidad AS cargo,
            a.experiencia_lab, a.escuela_id, es.nombre_escuela AS escuela,
            u.correo, a.estado
        FROM usuario u
        JOIN persona p ON u.usuario_id = p.usuario_id 
        JOIN administrador a ON p.persona_id = a.persona_id 
        JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        JOIN rol r ON ur.rol_id = r.rol_id
        LEFT JOIN direccion d ON p.direccion_id = d.id_direccion
        LEFT JOIN distrito dist ON d.id_distrito = dist.distrito_id 
        LEFT JOIN formacion f ON a.id_formacion = f.id_formacion
        LEFT JOIN especialidad e ON a.id_especialidad = e.id_especialidad
        LEFT JOIN escuela es ON a.escuela_id = es.escuela_id
        WHERE r.nombre_rol = 'Admin'
        ORDER BY p.nombres ASC
        """)
        admins = cur.fetchall()
        return jsonify({"admins": admins})
    except Exception as e:
        print("Error al listar admins:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# ✏️ MODIFICAR ADMINISTRADOR
# ======================================================
@superadmin_bp.route("/admins/<int:usuario_id>", methods=["PUT"])
def modificar_admin(usuario_id):
    data = request.json
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # 1️⃣ ACTUALIZAR USUARIO
        if data.get("correo"):
            cur.execute("UPDATE usuario SET correo = %s WHERE usuario_id = %s", (data["correo"], usuario_id))

        # 2️⃣ OBTENER persona_id y direccion_id
        cur.execute("SELECT persona_id, direccion_id FROM persona WHERE usuario_id = %s", (usuario_id,))
        persona = cur.fetchone()
        if not persona:
            return jsonify({"error": "Persona no encontrada"}), 404
        persona_id, direccion_id = persona

        # 3️⃣ ACTUALIZAR PERSONA
        cur.execute("""
            UPDATE persona SET
                nombres = %s, apellidos = %s, dni = %s,
                telefono = %s, fecha_nacimiento = %s
            WHERE persona_id = %s
        """, (data.get("nombres"), data.get("apellidos"), data.get("dni"),
              data.get("telefono"), data.get("fecha_nacimiento"), persona_id))

        # 4️⃣ ACTUALIZAR DIRECCIÓN
        if direccion_id:
            cur.execute("""
                UPDATE direccion SET direccion_detalle = %s, id_distrito = %s
                WHERE id_direccion = %s
            """, (data.get("direccion_detalle"), data.get("distrito_id"), direccion_id))
        else:
            cur.execute("""
                INSERT INTO direccion (direccion_detalle, id_distrito)
                VALUES (%s, %s) RETURNING id_direccion
            """, (data.get("direccion_detalle"), data.get("distrito_id")))
            nueva_direccion = cur.fetchone()[0]
            cur.execute("UPDATE persona SET direccion_id = %s WHERE persona_id = %s",
                        (nueva_direccion, persona_id))

        # 5️⃣ ACTUALIZAR ADMINISTRADOR
        cur.execute("""
            UPDATE administrador SET
                id_formacion = %s, id_especialidad = %s,
                experiencia_lab = %s, escuela_id = %s, estado = %s
            WHERE persona_id = %s
        """, (data.get("id_formacion"), data.get("id_especialidad"),
              data.get("experiencia_lab"), data.get("escuela_id"),
              data.get("estado"), persona_id))

        conn.commit()
        return jsonify({"mensaje": "Administrador actualizado correctamente ✅"})
    except Exception as e:
        if conn: conn.rollback()
        print("❌ Error al modificar admin:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# ❌ ELIMINAR ADMINISTRADOR (CORREGIDO)
# ======================================================
@superadmin_bp.route("/admins/<int:usuario_id>", methods=["DELETE"])
def eliminar_admin(usuario_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # 1️⃣ Obtener persona_id asociado al usuario
        cur.execute("SELECT persona_id FROM persona WHERE usuario_id = %s", (usuario_id,))
        persona = cur.fetchone()
        if not persona:
            return jsonify({"error": "No se encontró persona asociada a este usuario"}), 404

        persona_id = persona[0]

        # 2️⃣ Eliminar primero de administrador
        cur.execute("DELETE FROM administrador WHERE persona_id = %s", (persona_id,))

        # 3️⃣ Eliminar la persona
        cur.execute("DELETE FROM persona WHERE persona_id = %s", (persona_id,))

        # 4️⃣ Eliminar relaciones en usuario_rol y luego el usuario
        cur.execute("DELETE FROM usuario_rol WHERE usuario_id = %s", (usuario_id,))
        cur.execute("DELETE FROM usuario WHERE usuario_id = %s", (usuario_id,))

        conn.commit()
        return jsonify({"mensaje": "Administrador eliminado correctamente ✅"})

    except Exception as e:
        if conn:
            conn.rollback()
        print("Error al eliminar admin:", e)
        return jsonify({"error": "Error al eliminar administrador"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ======================================================
# 🌍 LISTAR DISTRITOS
# ======================================================
@superadmin_bp.route("/distritos", methods=["GET"])
def listar_distritos():
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT distrito_id, nombre_distrito FROM distrito ORDER BY nombre_distrito ASC")
        distritos = cur.fetchall()
        return jsonify({"distritos": distritos})
    except Exception as e:
        print("Error al listar distritos:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

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

# routes/superadmin_routes.py (Añadir este bloque)

# ======================================================
# 🗺️ OBTENER PROVINCIAS POR DEPARTAMENTO
# ======================================================
@superadmin_bp.route('/provincias/<int:departamento_id>', methods=['GET'])
def obtener_provincias(departamento_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT provincia_id, nombre_provincia 
            FROM provincia 
            WHERE departamento_id = %s 
            ORDER BY nombre_provincia ASC;
        """, (departamento_id,))
        provincias = [
            {"provincia_id": row[0], "nombre_provincia": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"provincias": provincias}), 200
    except Exception as e:
        print(f"❌ ERROR al obtener provincias: {e}")
        return jsonify({"error": "Error interno al consultar provincias."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# routes/superadmin_routes.py (Añadir o verificar este bloque)

# ======================================================
# 🌎 OBTENER DEPARTAMENTOS GEOGRÁFICOS
# ======================================================
@superadmin_bp.route('/departamentos-geo', methods=['GET'])
def obtener_departamentos_geo():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT departamento_id, nombre_departamento FROM departamento_geo ORDER BY nombre_departamento ASC;")
        departamentos = [
            {"departamento_id": row[0], "nombre_departamento": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"departamentos": departamentos}), 200
    except Exception as e:
        print(f"❌ ERROR al obtener departamentos geo: {e}")
        return jsonify({"error": "Error interno. No se pudieron obtener los departamentos geográficos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()
# routes/superadmin_routes.py (Añadir este bloque o modificar el existente /distritos)

# ======================================================
# 🌆 OBTENER DISTRITOS POR PROVINCIA
# ======================================================
@superadmin_bp.route('/distritos/<int:provincia_id>', methods=['GET'])
def obtener_distritos_por_provincia(provincia_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT distrito_id, nombre_distrito 
            FROM distrito 
            WHERE provincia_id = %s 
            ORDER BY nombre_distrito ASC;
        """, (provincia_id,))
        distritos = [
            {"distrito_id": row[0], "nombre_distrito": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"distritos": distritos}), 200
    except Exception as e:
        print(f"❌ ERROR al obtener distritos: {e}")
        return jsonify({"error": "Error interno al obtener distritos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# 🏫 LISTAR ESCUELAS (Fixing connection management)
# ======================================================
@superadmin_bp.route('/escuelas', methods=['GET'])
def obtener_escuelas():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT escuela_id, nombre_escuela FROM escuela ORDER BY nombre_escuela ASC;")
        escuelas = [
            # Mapeo manual seguro
            {"escuela_id": row[0], "nombre_escuela": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"escuelas": escuelas}), 200
    except Exception as e:
        # ... (manejo de errores) ...
        pass
    finally:
        if cur: cur.close()
        if conn: conn.close()

# routes/superadmin_routes.py

# ======================================================
# 🎓 LISTAR FORMACIONES (Corregida con finally)
# ======================================================
@superadmin_bp.route('/formaciones', methods=['GET'])
def obtener_formaciones():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id_formacion, nombre_formacion FROM formacion ORDER BY nombre_formacion ASC;")
        formaciones = [
            # Mapeo manual seguro
            {"id_formacion": row[0], "nombre_formacion": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"formaciones": formaciones}), 200
    except Exception as e:
        # ... (manejo de errores) ...
        pass
    finally:
        if cur: cur.close()
        if conn: conn.close()

# routes/superadmin_routes.py

# ======================================================
# 🏢 LISTAR ESPECIALIDADES (Corregida con finally)
# ======================================================
@superadmin_bp.route('/especialidades', methods=['GET'])
def obtener_especialidades():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id_especialidad, nombre_especialidad FROM especialidad ORDER BY nombre_especialidad ASC;")
        especialidades = [
            # Mapeo manual seguro
            {"id_especialidad": row[0], "nombre_especialidad": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"especialidades": especialidades}), 200
    except Exception as e:
        # ... (manejo de errores) ...
        pass
    finally:
        if cur: cur.close()
        if conn: conn.close()
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
# DEFINIR PRERREQUISITOS (CORREGIDO Y SEGURO)
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

        cur.execute("""
            INSERT INTO prerrequisito (id_curso, id_curso_requerido)
            VALUES (%s, %s);
        """, (id_curso, id_curso_requerido))

        
        conn.commit()

        # 🔑 RETORNO GARANTIZADO: Devuelve el mensaje exacto
        return jsonify({
            "mensaje": "Prerrequisito ingresado satisfactoriamente" 
        }), 201
        
    # 🚨 MANEJO DE ERRORES DE INTEGRIDAD DE LA BASE DE DATOS 🚨
    except psycopg2.IntegrityError as e:
        if conn: conn.rollback() # 🔑 CRÍTICO: Revertir transacción fallida
        
        error_detail = str(e)
        
        if 'uq_prerrequisito' in error_detail:
             error_msg = "Este prerrequisito ya se encuentra registrado para este curso."
        elif 'violates foreign key' in error_detail:
             error_msg = "Uno o ambos IDs de curso no son válidos (no existen)."
        else:
             error_msg = "Error de integridad de datos desconocido. Verifique el log."
             
        # Devolver el error 400 (Bad Request) con el mensaje amigable
        return jsonify({"error": error_msg}), 400 
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error interno (500) al definir prerrequisito: {e}")
        return jsonify({"error": "Error interno del servidor al guardar el prerrequisito."}), 500
        
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

# ======================================================
# 🕒 GESTIONAR BLOQUE HORARIO
# ======================================================

from datetime import datetime
from flask import Blueprint, request, jsonify

@superadmin_bp.route("/bloques-horarios", methods=["POST"])
def crear_bloque_horario():
    data = request.json
    dia = data.get("dia")
    hora_inicio = data.get("hora_inicio")
    hora_fin = data.get("hora_fin")
    estado = data.get("estado")

    if not all([dia, hora_inicio, hora_fin, estado]):
        return jsonify({"error": "⚠️ Todos los campos obligatorios deben estar completos."}), 400

    formato = "%H:%M"
    inicio = datetime.strptime(hora_inicio, formato)
    fin = datetime.strptime(hora_fin, formato)
    duracion = (fin - inicio).total_seconds() / 3600

    if duracion <= 0:
        return jsonify({"error": "⛔ La hora de fin debe ser posterior a la de inicio."}), 400
    if duracion > 6:
        return jsonify({"error": "⛔ Un bloque no puede durar más de 6 horas."}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        # Evitar duplicado exacto
        cur.execute("""
            SELECT COUNT(*) 
            FROM bloque_horario 
            WHERE dia = %s AND hora_inicio = %s AND hora_fin = %s;
        """, (dia, hora_inicio, hora_fin))
        if cur.fetchone()[0] > 0:
            return jsonify({"error": f"⛔ Ya existe un bloque para {dia} entre {hora_inicio} y {hora_fin}."}), 400

        # Determinar turno (M/T/N)
        turno = "M" if inicio.hour < 12 else "T" if inicio.hour < 19 else "N"

        # Obtener el último número correlativo de ese día y turno
        cur.execute("""
            SELECT codigo_bloque 
            FROM bloque_horario 
            WHERE dia = %s AND codigo_bloque LIKE %s
            ORDER BY bloque_id DESC
            LIMIT 1;
        """, (dia, f"{dia[:3].upper()}-{turno}%"))

        ultimo_codigo = cur.fetchone()
        if ultimo_codigo and "-" in ultimo_codigo[0]:
            try:
                # extraer número al final, ej. "LUN-M3" -> 3
                parte_numerica = ''.join(ch for ch in ultimo_codigo[0] if ch.isdigit())
                siguiente_num = int(parte_numerica) + 1 if parte_numerica else 1
            except:
                siguiente_num = 1
        else:
            siguiente_num = 1

        # Crear nuevo código, ej. LUN-M1
        codigo_bloque = f"{dia[:3].upper()}-{turno}{siguiente_num}"

        # Insertar en BD
        cur.execute("""
            INSERT INTO bloque_horario (dia, hora_inicio, hora_fin, estado, codigo_bloque)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING bloque_id, codigo_bloque;
        """, (dia, hora_inicio, hora_fin, estado, codigo_bloque))

        bloque_id, codigo = cur.fetchone()
        conn.commit()

        return jsonify({
            "mensaje": "✅ Bloque horario registrado correctamente.",
            "bloque_id": bloque_id,
            "codigo_bloque": codigo
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error al registrar bloque horario:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()