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

# routes/superadmin_routes.py

# ======================================================
# 🧱 CREAR ADMINISTRADOR (FINAL CORRECCIÓN DE COLUMNAS)
# ======================================================
@superadmin_bp.route("/crear-admin", methods=["POST"])
def crear_admin():
    data = request.json
    
    # 1. Recolección de Datos (Ajuste de nombres para coincidir con el Frontend/BD)
    nombres = data.get("nombres")
    apellidos = data.get("apellidos")
    dni = data.get("dni")
    telefono = data.get("telefono")
    correo_personal = data.get("correo_personal")
    id_direccion = data.get("id_direccion")
    
    # 🔑 CORRECCIÓN 1: La variable que viene del frontend es 'direccion_detalle', no 'detalle'
    direccion_detalle = data.get("direccion_detalle") 
    
    distrito_id = data.get("distrito_id") 
    fecha_nacimiento_str = data.get("fecha_nacimiento")
    id_formacion = data.get("id_formacion")
    id_especialidad = data.get("id_especialidad")
    experiencia_lab = data.get("experiencia_lab")
    escuela_id = data.get("escuela_id")
    id_direccion = data.get("id_direccion")

    # ... (Validaciones: se asume que las validaciones de DNI/Teléfono existen) ...
    # ... (Generación de contraseñas y correos) ...

    # Conversión de Fecha (Lógica de multi-formato, ya revisada)
    fecha_nacimiento_obj = None
    if fecha_nacimiento_str:
        try:
            fecha_nacimiento_obj = datetime.strptime(fecha_nacimiento_str, '%d/%m/%Y').date()
        except ValueError:
            try:
                fecha_nacimiento_obj = datetime.strptime(fecha_nacimiento_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Formato de fecha de nacimiento inválido."}), 400
        except TypeError:
            pass
    
    correo_institucional = generar_correo_institucional(nombres, apellidos)
    contrasena_generada = generar_contrasena()
    contrasena_hash = hash_password(contrasena_generada)

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # PASO 1: Crear la DIRECCIÓN (Domicilio)
        # 🔑 Si tu tabla usa id_distrito y retorna id_direccion, esta línea es CORRECTA.
        cur.execute(
            "INSERT INTO direccion (id_distrito, direccion_detalle) VALUES (%s, %s) RETURNING id_direccion",
            (data.get("distrito_id"), data.get("direccion_detalle"))
        )
        direccion_id = cur.fetchone()[0] 

        # PASO 2: Crear el USUARIO (Login)
        cur.execute(
            "INSERT INTO usuario (correo, contrasena, estado) VALUES (%s, %s, 'Activo') RETURNING usuario_id",
            (correo_institucional, contrasena_hash),
        )
        usuario_id = cur.fetchone()[0]
        
        # PASO 3: Crear la PERSONA (Datos Personales Centralizados)
        # 🔑 CORRECCIÓN CRÍTICA: Añadir direccion_id y usar la variable correcta
        cur.execute("""
            INSERT INTO persona (usuario_id, direccion_id, nombres, apellidos, dni, telefono, fecha_nacimiento)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING persona_id
        """, (
            usuario_id, direccion_id, data.get("nombres"), data.get("apellidos"), data.get("dni"), data.get("telefono"), fecha_nacimiento_obj
        ))
        persona_id = cur.fetchone()[0]

        # PASO 4: Crear el ADMINISTRADOR (Perfil de Rol)
        # 🔑 CORRECCIÓN: Eliminamos el campo redundante 'id_direccion'
        cur.execute("""
            INSERT INTO administrador (
                persona_id, id_formacion, id_especialidad, experiencia_lab, escuela_id, estado
            ) VALUES (%s,%s,%s,%s,%s,'Activo')
        """, (
            persona_id, data.get("id_formacion"), data.get("id_especialidad"), data.get("experiencia_lab"), data.get("escuela_id")
        ))

        # PASO 5: Asignar Rol 'Admin'
        cur.execute(
            "INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (%s, (SELECT rol_id FROM rol WHERE nombre_rol='Admin'))",
            (usuario_id,),
        )

        conn.commit()
        
        # Enviar credenciales y devolver éxito
        # Asumiendo que enviar_credenciales usa correo_personal, correo_institucional, contrasena_generada
        return jsonify({"mensaje": f"Administrador creado exitosamente. Credenciales enviadas a {data.get('correo_personal')}."}), 201

    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        # ... (Lógica de manejo de errores de DNI/Correo) ...
        return jsonify({"error": "El DNI, correo o una clave foránea (Distrito, etc.) ya existe o es inválida."}), 400

    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error al crear administrador: {e}")
        return jsonify({"error": "Error interno del servidor. No se pudo completar el registro."}), 500
    
    finally:
        if cur: cur.close()
        if conn: conn.close()

# routes/superadmin_routes.py

# ======================================================
# 📋 LISTAR ADMINISTRADORES (COMPATIBLE CON PERSONA)
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
            
            -- 🔑 CRÍTICO: Concatenamos el domicilio y distrito en una columna 'direccion'
            (d.direccion_detalle || ', ' || dist.nombre_distrito) AS direccion,
            
            a.id_formacion, f.nombre_formacion AS formacion,
            a.id_especialidad, e.nombre_especialidad AS cargo,
            a.experiencia_lab, 
            a.escuela_id, es.nombre_escuela AS escuela,
            u.correo, 
            a.estado
        FROM usuario u
        JOIN persona p ON u.usuario_id = p.usuario_id 
        JOIN administrador a ON p.persona_id = a.persona_id 
        JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        JOIN rol r ON ur.rol_id = r.rol_id
        
        -- 🔑 1. JOIN a DIRECCION: persona.direccion_id (FK) = direccion.id_direccion (PK)
        LEFT JOIN direccion d ON p.direccion_id = d.id_direccion
        
        -- 🔑 2. JOIN a DISTRITO: direccion.id_distrito (FK) = distrito.distrito_id (PK)
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
        print("Error al listar admins:", str(e))
        return jsonify({"error": "Error al listar administradores. Verifique los JOINS."}), 500
        
    finally:
        if cur: cur.close()
        if conn: conn.close()
# routes/superadmin_routes.py

# ======================================================
# ✏️ MODIFICAR ADMINISTRADOR (ACTUALIZADO para 3 TABLAS)
# ======================================================
@superadmin_bp.route("/admins/<int:usuario_id>", methods=["PUT"])
def modificar_admin(usuario_id):
    data = request.json
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # 1. ACTUALIZAR USUARIO (Correo)
        if "correo" in data and data["correo"]:
             cur.execute("UPDATE usuario SET correo = %s WHERE usuario_id = %s", 
                         (data["correo"], usuario_id))

        # 2. OBTENER persona_id y direccion_id asociados a este usuario
        cur.execute("""
            SELECT p.persona_id, p.direccion_id 
            FROM persona p
            WHERE p.usuario_id = %s
        """, (usuario_id,))
        resultado = cur.fetchone()
        if not resultado:
            return jsonify({"error": "Usuario o Persona no encontrado para modificar."}), 404
        
        persona_id = resultado[0]
        direccion_id = resultado[1]

        # 3. ACTUALIZAR PERSONA (Datos Personales y Ubicación)
        cur.execute("""
            UPDATE persona
            SET nombres = %s, apellidos = %s, dni = %s, telefono = %s, fecha_nacimiento = %s
            WHERE persona_id = %s
        """, (
            data.get("nombres"), data.get("apellidos"), data.get("dni"), data.get("telefono"),
            data.get("fecha_nacimiento"), persona_id
        ))

        # 4. ACTUALIZAR DIRECCION (Detalle de la dirección y distrito_id)
        # Nota: Asume que el frontend envía 'direccion_detalle' y 'distrito_id'
        if direccion_id: # Solo actualizamos si ya tiene una dirección registrada
             cur.execute("""
                 UPDATE direccion
                 SET detalle = %s, distrito_id = %s
                 WHERE direccion_id = %s
             """, (
                 data.get("direccion_detalle"), data.get("distrito_id"), direccion_id
             ))
        
        # 5. ACTUALIZAR ADMINISTRADOR (Datos de Rol/Institucionales)
        cur.execute("""
            UPDATE administrador
            SET id_formacion = %s, id_especialidad = %s, experiencia_lab = %s, 
                escuela_id = %s, estado = %s
            WHERE persona_id = %s
        """, (
            data.get("id_formacion"), data.get("id_especialidad"), data.get("experiencia_lab"), 
            data.get("escuela_id"), data.get("estado"), persona_id
        ))

        conn.commit()
        return jsonify({"mensaje": "Administrador actualizado correctamente ✅"})

    except Exception as e:
        if conn: conn.rollback()
        print("❌ Error al modificar administrador:", str(e))
        return jsonify({"error": "Error al actualizar administrador"}), 500
    
    finally:
        if cur: cur.close()
        if conn: conn.close()

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


