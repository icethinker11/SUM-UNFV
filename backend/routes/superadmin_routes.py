# routes/superadmin_routes.py
# -- coding: utf-8 --
import re
import random
import string
from flask import Blueprint, request, jsonify, current_app
from psycopg2.extras import RealDictCursor
import psycopg2 
from database.db import get_db
from utils.security import hash_password
from flask_mail import Message
from extensions import mail 
from datetime import datetime 

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

# ======================================================
# ✉️ ENVÍO DE CREDENCIALES CON HTML PROFESIONAL
# ======================================================
def enviar_credenciales(correo_destino, correo_institucional, contrasena):
    try:
        html_body = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <div style="text-align: center; border-bottom: 3px solid #004080; padding-bottom: 10px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Logo_UNFV.png" alt="UNFV" width="90"/>
                <h2 style="color: #004080;">Universidad Nacional Federico Villarreal</h2>
            </div>
            <p>¡Bienvenido(a) al <strong>Sistema de Gestión UNFV</strong>!</p>
            <p>Se han generado tus credenciales institucionales de acceso:</p>

            <table style="border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <td style="padding: 6px 10px; font-weight: bold;">Correo institucional:</td>
                    <td style="padding: 6px 10px; background: #f4f4f4;">{correo_institucional}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 10px; font-weight: bold;">Contraseña:</td>
                    <td style="padding: 6px 10px; background: #f4f4f4;">{contrasena}</td>
                </tr>
            </table>

            <p style="margin-top: 20px;">Por favor, cambia tu contraseña después de iniciar sesión.</p>
            <hr style="margin-top: 30px; border: 1px solid #ccc;"/>
            <p style="font-size: 12px; text-align: center; color: #666;">
                Este correo fue generado automáticamente por el sistema UNFV.<br/>
                Si no solicitaste este acceso, ignora este mensaje.
            </p>
        </div>
        """

        msg = Message(
            subject="🎓 Credenciales de acceso - Sistema UNFV",
            recipients=[correo_destino],
            html=html_body
        )

        # Aseguramos el contexto de la app Flask
        with current_app.app_context():
            mail.send(msg)

        print(f"✅ Correo enviado correctamente a {correo_destino}")
        return True
    except Exception as e:
        print("❌ Error al enviar correo:", str(e))
        return False

# ======================================================
# 🧱 CREAR ADMINISTRADOR (FINAL, CORREGIDO Y MEJORADO)
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

        # === PASO 6: ENVÍO DE CREDENCIALES ===
        enviado = enviar_credenciales(data['correo_personal'], correo_institucional, contrasena_generada)
        if not enviado:
            print(f"⚠️ No se pudo enviar el correo a {data['correo_personal']}")

        return jsonify({
            "mensaje": f"✅ Administrador creado exitosamente. Credenciales enviadas a {data['correo_personal']}."
        }), 201

    # === 7️⃣ ERRORES ESPECÍFICOS ===
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
# 📚 RUTAS DE CURSOS Y PRERREQUISITOS (CON MANEJO DE ERRORES MEJORADO)
# ======================================================
@superadmin_bp.route('/cursos', methods=['GET'])
def obtener_cursos():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor) 
        cur.execute("SELECT curso_id AS id_curso, nombre AS nombre_curso, codigo AS codigo_curso FROM curso ORDER BY nombre ASC;")
        return jsonify({"cursos": cur.fetchall()}), 200
    except Exception as e:
        print(f"❌ Error al obtener cursos: {str(e)}")
        return jsonify({"error": "Error interno al obtener cursos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@superadmin_bp.route('/cursos-con-prerrequisitos', methods=['GET'])
def obtener_cursos_con_prerrequisitos():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT 
                c1.curso_id, c1.codigo AS codigo_curso, c1.nombre AS nombre_curso,
                p.id_prerrequisito, c2.codigo AS codigo_requerido,
                c2.curso_id AS id_curso_requerido, c2.nombre AS nombre_requerido
            FROM prerrequisito p
            JOIN curso c1 ON p.id_curso = c1.curso_id
            JOIN curso c2 ON p.id_curso_requerido = c2.curso_id
            ORDER BY c1.nombre, c2.codigo;
        """)
        results = cur.fetchall()
        cursos_agrupados = {}
        for row in results:
            if row['curso_id'] not in cursos_agrupados:
                cursos_agrupados[row['curso_id']] = {
                    "curso_id": row['curso_id'], "codigo_curso": row['codigo_curso'],
                    "nombre_curso": row['nombre_curso'], "prerrequisitos": []
                }
            cursos_agrupados[row['curso_id']]['prerrequisitos'].append({
                "prerrequisito_id": row['id_prerrequisito'], "codigo_requerido": row['codigo_requerido'],
                "id_curso_requerido": row['id_curso_requerido'], "nombre_requerido": row['nombre_requerido']
            })
        return jsonify({"cursos": list(cursos_agrupados.values())}), 200
    except Exception as e:
        print(f"❌ Error al obtener cursos con prerrequisitos: {e}")
        return jsonify({"error": "Error interno al consultar los cursos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@superadmin_bp.route("/definir-prerrequisito", methods=["POST"])
def definir_prerrequisito():
    data = request.json
    id_curso = data.get("id_curso")
    id_curso_requerido = data.get("id_curso_requerido")

    if not id_curso or not id_curso_requerido or id_curso == id_curso_requerido:
        return jsonify({"error": "Datos de prerrequisito inválidos."}), 400
    
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        print(f"✅ Intentando insertar: id_curso={id_curso}, id_curso_requerido={id_curso_requerido}")
        cur.execute(
            "INSERT INTO prerrequisito (id_curso, id_curso_requerido) VALUES (%s, %s);",
            (id_curso, id_curso_requerido)
        )
        conn.commit()
        print("✅ Inserción de prerrequisito exitosa.")
        return jsonify({"mensaje": "Prerrequisito guardado correctamente."}), 201
    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        error_detail = str(e).lower()
        print(f"🔥 Error de integridad al guardar prerrequisito: {error_detail}")

        if "prerrequisito_pkey" in error_detail or "violates not-null constraint" in error_detail:
             msg = "Error de BD: La columna 'id_prerrequisito' podría no ser autoincremental (SERIAL)."
        elif "duplicate key value violates unique constraint" in error_detail:
             msg = "Este prerrequisito ya se encuentra registrado para este curso."
        elif "violates foreign key constraint" in error_detail:
             msg = "Uno o ambos IDs de curso no son válidos (no existen)."
        else:
             msg = f"Error de integridad de datos. {str(e)}"
        
        return jsonify({"error": msg}), 400
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error inesperado al definir prerrequisito: {e}")
        return jsonify({"error": "Error interno del servidor al guardar el prerrequisito."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@superadmin_bp.route("/prerrequisitos/<int:id_prerrequisito>", methods=["DELETE"])
def eliminar_prerrequisito(id_prerrequisito):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM prerrequisito WHERE id_prerrequisito = %s", (id_prerrequisito,))
        if cur.rowcount == 0:
            return jsonify({"error": "El prerrequisito no fue encontrado."}), 404
        conn.commit()
        return jsonify({"mensaje": "Prerrequisito eliminado correctamente."}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "Error interno al eliminar el prerrequisito."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@superadmin_bp.route('/prerrequisitos/curso/<int:id_curso>', methods=['DELETE'])
def eliminar_prerrequisitos_por_curso(id_curso):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM prerrequisito WHERE id_curso = %s", (id_curso,))
        conn.commit()
        return jsonify({"mensaje": "Prerrequisitos eliminados."}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "Error interno al limpiar prerrequisitos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# 1. LISTAR AULAS (CORREGIDO SEGÚN LA ESTRUCTURA DE TU BD)
# ======================================================
@superadmin_bp.route('/aulas', methods=['GET'])
def listar_aulas():
    """Muestra el listado de todas las aulas con sus detalles de ubicación y tipo."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 👇 ESTA CONSULTA HA SIDO CORREGIDA
        cur.execute("""
            SELECT 
                a.aula_id, 
                a.nombre_aula AS codigo, -- USAMOS 'nombre_aula' como el código principal
                a.nombre_aula AS nombre, -- Y también como el nombre
                a.capacidad, 
                a.estado,
                tac.nombre_tipo AS tipo,
                -- 🔑 CORRECCIÓN: Eliminamos la columna 'piso' porque no existe en tu tabla 'aula'
                pab.nombre_pabellon AS ubicacion 
            FROM aula a
            LEFT JOIN tipo_aula_cat tac ON a.tipo_aula_id = tac.tipo_aula_id
            LEFT JOIN pabellon pab ON a.pabellon_id = pab.pabellon_id
            -- 🔑 CORRECCIÓN: Ordenamos por 'nombre_aula'
            ORDER BY a.nombre_aula ASC;
        """)
        aulas = cur.fetchall()
        return jsonify(aulas), 200

    except Exception as e:
        print(f"❌ Error al listar aulas: {e}")
        return jsonify({"error": "Error interno al listar las aulas."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# 2. CREAR AULA (POST /superadmin/aulas) - VERSIÓN FINAL
# ======================================================
@superadmin_bp.route('/aulas', methods=['POST'])
def crear_aula():
    data = request.json
    # Usamos los nombres de columna correctos de tu tabla 'aula'
    nombre_aula = data.get('nombre_aula')
    capacidad = data.get('capacidad')
    estado = data.get('estado')
    tipo_aula_id = data.get('tipo_aula_id')
    pabellon_id = data.get('pabellon_id')
    
    if not all([nombre_aula, capacidad, tipo_aula_id, pabellon_id, estado]):
        return jsonify({"error": "Faltan campos obligatorios."}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO aula (nombre_aula, capacidad, estado, tipo_aula_id, pabellon_id)
            VALUES (%s, %s, %s, %s, %s);
        """, (nombre_aula, capacidad, estado, tipo_aula_id, pabellon_id))
        
        conn.commit()
        return jsonify({"mensaje": "Aula registrada exitosamente."}), 201
        
    except psycopg2.IntegrityError:
        if conn: conn.rollback()
        return jsonify({"error": "El nombre del aula ya existe o un ID es inválido."}), 400
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error al crear aula: {e}")
        return jsonify({"error": "Error interno al registrar el aula."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# 3. ACTUALIZAR AULA (PUT /superadmin/aulas/<id>) - VERSIÓN FINAL
# ======================================================
@superadmin_bp.route('/aulas/<int:aula_id>', methods=['PUT'])
def actualizar_aula(aula_id):
    data = request.json
    nombre_aula = data.get('nombre_aula')
    capacidad = data.get('capacidad')
    estado = data.get('estado')
    tipo_aula_id = data.get('tipo_aula_id')
    pabellon_id = data.get('pabellon_id')

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            UPDATE aula
            SET nombre_aula=%s, capacidad=%s, estado=%s, tipo_aula_id=%s, pabellon_id=%s
            WHERE aula_id = %s;
        """, (nombre_aula, capacidad, estado, tipo_aula_id, pabellon_id, aula_id))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Aula no encontrada."}), 404
        
        conn.commit()
        return jsonify({"mensaje": "Aula actualizada exitosamente."}), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error al actualizar aula: {e}")
        return jsonify({"error": "Error interno al actualizar el aula."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# 4. ELIMINAR AULA (DELETE /superadmin/aulas/<id>) - CORREGIDO
# ======================================================
@superadmin_bp.route('/aulas/<int:aula_id>', methods=['DELETE'])
def eliminar_aula(aula_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # PRIMERO: Verificar si el aula está asignada en algún horario.
        # 🔑 CORRECCIÓN: Se asume que la columna es 'estado' y no 'estado_vigencia'.
        # Si tu columna tiene otro nombre (ej. 'vigencia'), ajústalo aquí.
        cur.execute("""
            SELECT COUNT(*) 
            FROM horario h
            JOIN seccion s ON h.seccion_id = s.seccion_id
            WHERE h.aula_id = %s AND s.estado = 'Vigente';
        """, (aula_id,))
        
        if cur.fetchone()[0] > 0:
            # Si hay asignaciones, devuelve una advertencia (409 Conflict)
            return jsonify({"error": "No se puede eliminar. El aula está asignada a uno o más horarios vigentes."}), 409

        # SEGUNDO: Si no hay asignaciones, proceder con la eliminación
        cur.execute("DELETE FROM aula WHERE aula_id = %s;", (aula_id,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Aula no encontrada."}), 404
            
        conn.commit()
        return jsonify({"mensaje": "Aula eliminada correctamente."}), 200

    except Exception as e:
        if conn: conn.rollback()
        # Imprimimos el error específico de la base de datos
        print(f"❌ Error al eliminar aula: {e}")
        return jsonify({"error": "Error interno al eliminar el aula."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()
# ======================================================
# 🏛️ LISTAR PABELLONES
# ======================================================
@superadmin_bp.route('/pabellones', methods=['GET'])
def obtener_pabellones():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT pabellon_id, nombre_pabellon FROM pabellon ORDER BY nombre_pabellon ASC;")
        pabellones = cur.fetchall()
        return jsonify(pabellones), 200
    except Exception as e:
        print(f"❌ Error al obtener pabellones: {e}")
        return jsonify({"error": "Error interno al obtener pabellones."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# 🏷️ LISTAR TIPOS DE AULA
# ======================================================
@superadmin_bp.route('/tipos-aula', methods=['GET'])
def obtener_tipos_aula():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT tipo_aula_id, nombre_tipo FROM tipo_aula_cat ORDER BY nombre_tipo ASC;")
        tipos_aula = cur.fetchall()
        return jsonify(tipos_aula), 200
    except Exception as e:
        print(f"❌ Error al obtener tipos de aula: {e}")
        return jsonify({"error": "Error interno al obtener tipos de aula."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# 🕒 GESTIONAR BLOQUE HORARIO
# ======================================================
# 1. registrar horario 
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

# ======================================================
# 📋 LISTAR BLOQUES HORARIOS (versión corregida JSON)
# ======================================================
@superadmin_bp.route("/bloques-horarios", methods=["GET"])
def listar_bloques_horarios():
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            SELECT 
                bloque_id,
                codigo_bloque,
                dia,
                hora_inicio,
                hora_fin,
                estado
            FROM bloque_horario
            ORDER BY bloque_id ASC;
        """)

        data = cur.fetchall()
        columnas = [desc[0] for desc in cur.description]

        bloques = []
        for fila in data:
            bloque = dict(zip(columnas, fila))

            # ✅ Convertir los objetos time a string (HH:MM)
            if isinstance(bloque["hora_inicio"], (bytes, bytearray)):
                bloque["hora_inicio"] = bloque["hora_inicio"].decode("utf-8")
            else:
                bloque["hora_inicio"] = str(bloque["hora_inicio"])[:5]

            if isinstance(bloque["hora_fin"], (bytes, bytearray)):
                bloque["hora_fin"] = bloque["hora_fin"].decode("utf-8")
            else:
                bloque["hora_fin"] = str(bloque["hora_fin"])[:5]

            bloques.append(bloque)

        return jsonify(bloques), 200

    except Exception as e:
        print("❌ Error al listar bloques:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ======================================================
# ✏️ EDITAR BLOQUE HORARIO
# ======================================================
@superadmin_bp.route("/bloques-horarios/<int:bloque_id>", methods=["PUT"])
def editar_bloque_horario(bloque_id):
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

        # ⚠️ Verificar duplicados (excluyendo el mismo bloque)
        cur.execute("""
            SELECT COUNT(*)
            FROM bloque_horario
            WHERE dia = %s AND hora_inicio = %s AND hora_fin = %s AND bloque_id != %s;
        """, (dia, hora_inicio, hora_fin, bloque_id))
        if cur.fetchone()[0] > 0:
            return jsonify({"error": f"⛔ Ya existe un bloque para {dia} entre {hora_inicio} y {hora_fin}."}), 400

        # 📌 Determinar nuevo turno y código si cambia hora/día
        turno = "M" if inicio.hour < 12 else "T" if inicio.hour < 19 else "N"
        cur.execute("""
            SELECT codigo_bloque
            FROM bloque_horario
            WHERE dia = %s AND codigo_bloque LIKE %s
            ORDER BY bloque_id DESC
            LIMIT 1;
        """, (dia, f"{dia[:3].upper()}-{turno}%"))
        ultimo_codigo = cur.fetchone()

        if ultimo_codigo and "-" in ultimo_codigo[0]:
            parte_numerica = ''.join(ch for ch in ultimo_codigo[0] if ch.isdigit())
            siguiente_num = int(parte_numerica) + 1 if parte_numerica else 1
        else:
            siguiente_num = 1

        codigo_bloque = f"{dia[:3].upper()}-{turno}{siguiente_num}"

        # ✏️ Actualizar bloque
        cur.execute("""
            UPDATE bloque_horario
            SET dia = %s, hora_inicio = %s, hora_fin = %s, estado = %s, codigo_bloque = %s
            WHERE bloque_id = %s
            RETURNING bloque_id, codigo_bloque;
        """, (dia, hora_inicio, hora_fin, estado, codigo_bloque, bloque_id))

        result = cur.fetchone()
        conn.commit()

        if not result:
            return jsonify({"error": "❌ Bloque no encontrado."}), 404

        return jsonify({
            "mensaje": "✅ Bloque horario actualizado correctamente.",
            "bloque_id": result[0],
            "codigo_bloque": result[1]
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error al editar bloque:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()

# ======================================================
# 🗑️ ELIMINAR BLOQUE HORARIO
# ======================================================
@superadmin_bp.route("/bloques-horarios/<int:bloque_id>", methods=["DELETE"])
def eliminar_bloque_horario(bloque_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        # Verificar que exista
        cur.execute("SELECT bloque_id FROM bloque_horario WHERE bloque_id = %s;", (bloque_id,))
        if not cur.fetchone():
            return jsonify({"error": "❌ El bloque no existe."}), 404

        # Eliminar
        cur.execute("DELETE FROM bloque_horario WHERE bloque_id = %s;", (bloque_id,))
        conn.commit()

        return jsonify({"mensaje": "🗑️ Bloque horario eliminado correctamente."}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error al eliminar bloque:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()

