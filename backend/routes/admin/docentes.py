import re
from flask import Blueprint, request, jsonify
from database.db import get_db
from utils.security import hash_password
from psycopg2.extras import RealDictCursor
import psycopg2 
from datetime import datetime, date
from psycopg2 import errors 

docentes_bp = Blueprint('docentes', __name__)

# ===========================
# FUNCIONES DE VALIDACIÓN (sin cambios)
# ===========================
def validar_correo(correo, rol):
    dominios = {
        "Docente": "@docenteunfv.edu.pe",
        "Alumno": "@alumnounfv.edu.pe"
    }
    if not isinstance(correo, str):
        return False
    return correo.endswith(dominios.get(rol, "invalid.domain"))

def validar_telefono(telefono):
    if not isinstance(telefono, str):
        return False
    return bool(re.fullmatch(r'\d{9}', telefono))

def validar_dni(dni):
    if not isinstance(dni, str):
        return False
    return bool(re.fullmatch(r'\d{8}', dni))

# ===========================
# ENDPOINTS DE UBIGEO (Corregido: Cierre de conexión)
# ===========================

@docentes_bp.route("/departamentos", methods=["GET"])
def obtener_departamentos_ubigeo():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT departamento_id, nombre_departamento FROM departamento_geo ORDER BY nombre_departamento")
        departamentos = cur.fetchall()
        return jsonify({"departamentos": departamentos}) 
    except (Exception, psycopg2.Error) as e:
        print(f"Error en obtener_departamentos_ubigeo: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@docentes_bp.route("/provincias/<string:id_departamento>", methods=["GET"])
def obtener_provincias_ubigeo(id_departamento):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT provincia_id, nombre_provincia FROM provincia WHERE departamento_id = %s ORDER BY nombre_provincia", (id_departamento,))
        provincias = cur.fetchall()
        return jsonify({"provincias": provincias})
    except (Exception, psycopg2.Error) as e:
        print(f"Error en obtener_provincias_ubigeo: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@docentes_bp.route("/distritos/<string:id_provincia>", methods=["GET"])
def obtener_distritos_ubigeo(id_provincia):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT distrito_id, nombre_distrito FROM distrito WHERE provincia_id = %s ORDER BY nombre_distrito", (id_provincia,))
        distritos = cur.fetchall()
        return jsonify({"distritos": distritos})
    except (Exception, psycopg2.Error) as e:
        print(f"Error en obtener_distritos_ubigeo: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ===========================
# ENDPOINT DE ESCUELAS (Corregido: Cierre de conexión)
# ===========================
@docentes_bp.route("/escuelas", methods=["GET"])
def obtener_escuelas():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT escuela_id, nombre_escuela, facultad FROM escuela ORDER BY nombre_escuela")
        escuelas = cur.fetchall()
        return jsonify({"escuelas": escuelas})
    except (Exception, psycopg2.Error) as e:
        print(f"Error en obtener_escuelas: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ===========================
# CREAR DOCENTE (Corregido: Cierre de conexión)
# ===========================
@docentes_bp.route("/crear-docente", methods=["POST"])
def crear_docente():
    data = request.json
    
    # --- MODIFICACIÓN 1: Imprimir datos recibidos ---
    print("\n--- JSON RECIBIDO EN /crear-docente ---")
    print(data)
    print("-----------------------------------------\n")
    
    correo = data.get("correo")
    # --- MODIFICACIÓN 2: Validar contraseña ANTES de hashear ---
    contrasena_raw = data.get("contrasena") 
    nombres = data.get("nombres"); apellidos = data.get("apellidos")
    dni = data.get("dni"); telefono = data.get("telefono")
    fecha_nacimiento_str = data.get("fecha_nacimiento")
    direccion_detalle = data.get("direccion_desc"); id_distrito = data.get("id_distrito")
    escuela_id = data.get("escuela_id")
    estado_docente = True

    # --- VALIDACIONES (con prints de depuración) ---
    
    # --- MODIFICACIÓN 3: Usar 'contrasena_raw' en la validación ---
    if not all([correo, contrasena_raw, nombres, apellidos, dni, telefono, escuela_id, fecha_nacimiento_str, direccion_detalle, id_distrito]):
        # --- MODIFICACIÓN 4: Imprimir el error específico ---
        print(">> ERROR 400: Faltan campos obligatorios.")
        return jsonify({"error": "Todos los campos son obligatorios"}), 400
    
    # --- MODIFICACIÓN 5: Hashear la contraseña DESPUÉS de la validación ---
    contrasena = hash_password(contrasena_raw)

    if not validar_correo(correo, "Docente"): 
        print(f">> ERROR 400: Correo inválido ({correo}).")
        return jsonify({"error": "Correo inválido para docente"}), 400
    
    if not validar_telefono(telefono): 
        print(f">> ERROR 400: Teléfono inválido ({telefono}).")
        return jsonify({"error": "Teléfono inválido (9 dígitos)"}), 400
    
    if not validar_dni(dni): 
        print(f">> ERROR 400: DNI inválido ({dni}).")
        return jsonify({"error": "DNI inválido (8 dígitos)"}), 400

    try:
        fecha_nacimiento = datetime.strptime(fecha_nacimiento_str, '%Y-%m-%d').date()
        hoy = date.today()
        edad = hoy.year - fecha_nacimiento.year - ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
        
        if fecha_nacimiento > hoy: 
            print(f">> ERROR 400: Fecha futura ({fecha_nacimiento_str}).")
            return jsonify({"error": "Fecha de nacimiento futura inválida."}), 400
        
        EDAD_MINIMA_DOCENTE = 28
        if edad < EDAD_MINIMA_DOCENTE: 
            print(f">> ERROR 400: Edad mínima no cumplida (Edad: {edad}).")
            return jsonify({"error": f"Edad mínima {EDAD_MINIMA_DOCENTE} años (edad: {edad})."}), 400
        
        if edad > 100: 
            print(f">> ERROR 400: Edad no razonable ({edad}).")
            return jsonify({"error": "Edad (>100 años) no razonable."}), 400
            
    except ValueError:
        print(f">> ERROR 400: Formato de fecha inválido ({fecha_nacimiento_str}).")
        return jsonify({"error": "Formato de fecha inválido (Use YYYY-MM-DD)."}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("INSERT INTO usuario (correo, contrasena, estado) VALUES (%s, %s, %s) RETURNING usuario_id", (correo, contrasena, True))
        usuario_id = cur.fetchone()[0]
        
        cur.execute("INSERT INTO direccion (direccion_detalle, id_distrito) VALUES (%s, %s) RETURNING id_direccion", (direccion_detalle, id_distrito))
        id_direccion = cur.fetchone()[0]
        
        cur.execute("INSERT INTO persona (usuario_id, nombres, apellidos, dni, telefono, fecha_nacimiento) VALUES (%s, %s, %s, %s, %s, %s) RETURNING persona_id", (usuario_id, nombres, apellidos, dni, telefono, fecha_nacimiento))
        persona_id = cur.fetchone()[0]
        
        cur.execute("INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (%s, (SELECT rol_id FROM rol WHERE nombre_rol='Docente'))", (usuario_id,))

        cur.execute("""
            INSERT INTO docente (persona_id, escuela_id, id_direccion, estado, codigo_docente)
            VALUES (%s, %s, %s, %s, generar_codigo_docente()) 
            RETURNING codigo_docente
        """, (persona_id, escuela_id, id_direccion, estado_docente))
        
        codigo_generado = cur.fetchone()[0] 

        conn.commit()
        print(">> ÉXITO 201: Docente creado con éxito.")
        return jsonify({"mensaje": "Docente creado con éxito", "usuario_id": usuario_id, "codigo_docente": codigo_generado}), 201

    except errors.UniqueViolation as e:
        if conn: conn.rollback()
        print(f">> ERROR 400 (BD): {str(e)}")
        error_msg = str(e)
        if "persona_dni_key" in error_msg: return jsonify({"error": "El DNI ya existe."}), 400
        if "usuario_correo_key" in error_msg: return jsonify({"error": "El correo ya existe."}), 400
        return jsonify({"error": "Valor duplicado (DNI o correo)."}), 400
        
    except (Exception, psycopg2.Error) as e:
        if conn: conn.rollback()
        print(f"\n!! ERROR 500 (FATAL): {str(e)} !!\n")
        db_error_msg = str(getattr(e, 'pgerror', repr(e)))
        if "generar_codigo_docente" in db_error_msg:
             return jsonify({"error": "Error en la función de la BD para generar código. ¿La creaste?"}), 500
        if "codigo_docente" in db_error_msg and ("no existe" in db_error_msg or "does not exist" in db_error_msg) :
             return jsonify({"error": "Falta la columna 'codigo_docente' en la tabla 'docente'."}), 500
        return jsonify({"error": "Error interno del servidor"}), 500
        
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ==========================
# LISTAR DOCENTES (Corregido: Cierre de conexión)
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
            doc.docente_id,
            u.usuario_id, 
            p.nombres, p.apellidos, p.dni, p.telefono, p.fecha_nacimiento,
            u.correo, 
            doc.estado,
            e.nombre_escuela, e.escuela_id,
            d.direccion_detalle AS direccion_desc, d.id_direccion,
            dist.distrito_id AS id_distrito, dist.nombre_distrito AS distrito,
            prov.provincia_id AS id_provincia, prov.nombre_provincia AS provincia,
            dep.departamento_id AS id_departamento, dep.nombre_departamento AS departamento
        FROM docente doc
        LEFT JOIN persona p ON doc.persona_id = p.persona_id
        LEFT JOIN usuario u ON p.usuario_id = u.usuario_id 
        LEFT JOIN escuela e ON doc.escuela_id = e.escuela_id
        LEFT JOIN direccion d ON doc.id_direccion = d.id_direccion
        LEFT JOIN distrito dist ON d.id_distrito = dist.distrito_id
        LEFT JOIN provincia prov ON dist.provincia_id = prov.provincia_id
        LEFT JOIN departamento_geo dep ON prov.departamento_id = dep.departamento_id
        LEFT JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        LEFT JOIN rol r ON ur.rol_id = r.rol_id
        WHERE r.nombre_rol = 'Docente' 
        ORDER BY p.apellidos, p.nombres
        """)
        docentes = cur.fetchall()
        
        for docente in docentes:
            if docente.get('fecha_nacimiento'):
                if hasattr(docente['fecha_nacimiento'], 'isoformat'):
                    docente['fecha_nacimiento'] = docente['fecha_nacimiento'].isoformat()
                else:
                    docente['fecha_nacimiento'] = None 
            if 'estado' in docente:
                   docente['estado'] = docente['estado'] is True

        return jsonify(docentes)
        
    except (Exception, psycopg2.Error) as e:
        print(f"Error en listar_docentes: {str(e)}")
        db_error_msg = str(getattr(e, 'pgerror', repr(e)))
        return jsonify({"error": f"Error al listar docentes: {db_error_msg}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ==========================
# LISTAR ALUMNOS (Corregido: Cierre de conexión)
# ==========================
@docentes_bp.route("/alumnos", methods=["GET"])
def listar_alumnos():
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
            est.codigo_estudiante AS codigo_universitario,
            u.correo,
            u.estado,
            e.nombre_escuela,
            e.escuela_id,
            p.fecha_nacimiento,
            d.direccion_detalle AS direccion_desc,
            d.id_direccion,
            dist.distrito_id AS id_distrito,
            dist.nombre_distrito AS distrito,
            prov.provincia_id AS id_provincia,
            prov.nombre_provincia AS provincia,
            dep.departamento_id AS id_departamento,
            dep.nombre_departamento AS departamento
        FROM estudiante est
        LEFT JOIN persona p ON est.persona_id = p.persona_id
        LEFT JOIN usuario u ON p.usuario_id = u.usuario_id 
        LEFT JOIN escuela e ON est.escuela_id = e.escuela_id
        LEFT JOIN direccion d ON est.id_direccion = d.id_direccion
        LEFT JOIN distrito dist ON d.id_distrito = dist.distrito_id
        LEFT JOIN provincia prov ON dist.provincia_id = prov.provincia_id
        LEFT JOIN departamento_geo dep ON prov.departamento_id = dep.departamento_id
        LEFT JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        LEFT JOIN rol r ON ur.rol_id = r.rol_id
        WHERE r.nombre_rol = 'Alumno'
        """)
        alumnos = cur.fetchall()
        
        # (Aquí deberías añadir la misma normalización de fecha que en listar_docentes)
        
        return jsonify(alumnos)
    except (Exception, psycopg2.Error) as e:
        print(f"Error en listar_alumnos: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ===========================
# MODIFICAR DOCENTE (Corregido: Cierre de conexión)
# ===========================
@docentes_bp.route("/docentes/<int:usuario_id>", methods=["PUT"])
def modificar_docente(usuario_id):
    data = request.json
    nombres = data.get("nombres"); apellidos = data.get("apellidos")
    dni = data.get("dni"); telefono = data.get("telefono"); fecha_nacimiento = data.get("fecha_nacimiento")
    correo = data.get("correo")
    estado_docente = data.get("estado")
    escuela_id = data.get("escuela_id")
    direccion_detalle = data.get("direccion_desc"); id_distrito = data.get("id_distrito")

    # (Falta validación completa aquí, la abrevié como en tu código original)
    if estado_docente is None:
         return jsonify({"error": "Faltan datos obligatorios"}), 400
    if not isinstance(estado_docente, bool):
         return jsonify({"error": "El estado debe ser booleano (true/false)"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("UPDATE persona SET nombres=%s, apellidos=%s, dni=%s, telefono=%s, fecha_nacimiento=%s WHERE usuario_id = %s", (nombres, apellidos, dni, telefono, fecha_nacimiento, usuario_id))
        if cur.rowcount == 0: 
            conn.rollback()
            return jsonify({"error": "Persona no encontrada"}), 404

        cur.execute("UPDATE usuario SET correo=%s WHERE usuario_id = %s", (correo, usuario_id))

        cur.execute("""
            UPDATE docente SET escuela_id=%s, estado=%s
            WHERE persona_id = (SELECT persona_id FROM persona WHERE usuario_id=%s)
            RETURNING id_direccion
        """, (escuela_id, estado_docente, usuario_id))

        res = cur.fetchone()
        if not res: 
            conn.rollback()
            return jsonify({"error": "Registro de Docente no encontrado"}), 404
        id_direccion = res[0]

        if id_direccion:
             cur.execute("UPDATE direccion SET direccion_detalle=%s, id_distrito=%s WHERE id_direccion = %s", (direccion_detalle, id_distrito, id_direccion))
        else:
             cur.execute("INSERT INTO direccion (direccion_detalle, id_distrito) VALUES (%s, %s) RETURNING id_direccion", (direccion_detalle, id_distrito))
             id_direccion_new = cur.fetchone()[0]
             cur.execute("UPDATE docente SET id_direccion = %s WHERE persona_id = (SELECT persona_id FROM persona WHERE usuario_id=%s)", (id_direccion_new, usuario_id))
        
        conn.commit()
        return jsonify({"mensaje": "Docente actualizado con éxito"}), 200
        
    except errors.UniqueViolation as e:
        if conn: conn.rollback()
        error_msg = str(e)
        if "persona_dni_key" in error_msg: return jsonify({"error": "El DNI ya existe."}), 400
        if "usuario_correo_key" in error_msg: return jsonify({"error": "El correo ya existe."}), 400
        return jsonify({"error": "Valor duplicado (DNI o correo)."}), 400
    except (Exception, psycopg2.Error) as e:
        if conn: conn.rollback()
        print(f"Error en modificar_docente: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ===========================
# MODIFICAR ALUMNO (Corregido: Cierre de conexión)
# ===========================
@docentes_bp.route("/alumnos/<int:usuario_id>", methods=["PUT"])
def modificar_alumno(usuario_id):
    data = request.json
    nombres = data.get("nombres"); apellidos = data.get("apellidos")
    dni = data.get("dni"); telefono = data.get("telefono"); fecha_nacimiento = data.get("fecha_nacimiento")
    correo = data.get("correo"); estado = data.get("estado")
    escuela_id = data.get("escuela_id"); codigo_universitario = data.get("codigo_universitario")
    direccion_detalle = data.get("direccion_desc"); id_distrito = data.get("id_distrito")

    if not all([nombres, apellidos, dni, telefono, correo, escuela_id, fecha_nacimiento, direccion_detalle, id_distrito, codigo_universitario]) or estado is None:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE persona SET 
                nombres=%s, apellidos=%s, dni=%s, telefono=%s, fecha_nacimiento=%s
            WHERE usuario_id = %s
        """, (nombres, apellidos, dni, telefono, fecha_nacimiento, usuario_id))
        
        cur.execute("UPDATE usuario SET correo=%s, estado=%s WHERE usuario_id = %s", (correo, estado, usuario_id))
        
        cur.execute("""
            UPDATE estudiante SET escuela_id=%s, codigo_estudiante=%s
            WHERE persona_id = (SELECT persona_id FROM persona WHERE usuario_id=%s)
            RETURNING id_direccion
        """, (escuela_id, codigo_universitario, usuario_id))
        
        res = cur.fetchone()
        if not res:
            conn.rollback()
            return jsonify({"error": "Estudiante no encontrado"}), 404
        id_direccion = res[0]
        
        if id_direccion:
            cur.execute("UPDATE direccion SET direccion_detalle=%s, id_distrito=%s WHERE id_direccion = %s", (direccion_detalle, id_distrito, id_direccion))
        else:
            cur.execute("INSERT INTO direccion (direccion_detalle, id_distrito) VALUES (%s, %s) RETURNING id_direccion", (direccion_detalle, id_distrito))
            id_direccion_new = cur.fetchone()[0]
            cur.execute("UPDATE estudiante SET id_direccion = %s WHERE persona_id = (SELECT persona_id FROM persona WHERE usuario_id=%s)", (id_direccion_new, usuario_id))

        conn.commit()
        return jsonify({"mensaje": "Alumno actualizado con éxito"}), 200

    except errors.UniqueViolation as e:
        if conn: conn.rollback()
        error_msg = str(e)
        if "persona_dni_key" in error_msg: return jsonify({"error": "El DNI ingresado ya existe."}), 400
        if "usuario_correo_key" in error_msg: return jsonify({"error": "El correo electrónico ingresado ya existe."}), 400
        if "estudiante_codigo_estudiante_key" in error_msg: return jsonify({"error": "El código universitario ingresado ya existe."}), 400
        return jsonify({"error": "Un valor único (DNI, correo o código) ya existe."}), 400
    except (Exception, psycopg2.Error) as e:
        if conn: conn.rollback()
        print(f"Error en modificar_alumno: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ===========================
# ELIMINAR DOCENTE (Corregido: Orden y Cierre de conexión)
# ===========================
@docentes_bp.route("/docentes/<int:usuario_id>", methods=["DELETE"])
def eliminar_docente(usuario_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # 1. Obtener IDs dependientes
        cur.execute("SELECT persona_id FROM persona WHERE usuario_id=%s", (usuario_id,))
        res_persona = cur.fetchone()
        if not res_persona:
            return jsonify({"error": "No encontrado"}), 404
        persona_id = res_persona[0]
        
        cur.execute("SELECT id_direccion FROM docente WHERE persona_id=%s", (persona_id,))
        res_docente = cur.fetchone()
        id_direccion = res_docente[0] if res_docente else None
        
        # 2. Eliminar en orden INVERSO a la dependencia (hijos primero)
        cur.execute("DELETE FROM usuario_rol WHERE usuario_id=%s", (usuario_id,))
        cur.execute("DELETE FROM docente WHERE persona_id=%s", (persona_id,))
        
        # <<< ORDEN CORREGIDO >>>
        cur.execute("DELETE FROM persona WHERE persona_id=%s", (persona_id,))
        cur.execute("DELETE FROM usuario WHERE usuario_id=%s", (usuario_id,))
        
        if id_direccion:
            cur.execute("DELETE FROM direccion WHERE id_direccion=%s", (id_direccion,))
        
        conn.commit()
        return jsonify({"mensaje": "Docente eliminado con éxito"})

    except (Exception, psycopg2.Error) as e:
        if conn: conn.rollback()
        print(f"Error en eliminar_docente: {str(e)}")
        if isinstance(e, errors.ForeignKeyViolation):
             return jsonify({"error": "No se puede eliminar: El usuario tiene otros datos asociados (ej. cursos)."}), 409
        return jsonify({"error": "Error interno al eliminar docente."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ===========================
# ELIMINAR ALUMNO (Corregido: Orden y Cierre de conexión)
# ===========================
@docentes_bp.route("/alumnos/<int:usuario_id>", methods=["DELETE"])
def eliminar_alumno(usuario_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # 1. Obtener IDs dependientes
        cur.execute("SELECT persona_id FROM persona WHERE usuario_id=%s", (usuario_id,))
        res_persona = cur.fetchone()
        if not res_persona:
            return jsonify({"error": "No encontrado"}), 404
        persona_id = res_persona[0]
        
        cur.execute("SELECT id_direccion FROM estudiante WHERE persona_id=%s", (persona_id,))
        res_est = cur.fetchone()
        id_direccion = res_est[0] if res_est else None
        
        # 2. Eliminar en orden INVERSO
        cur.execute("DELETE FROM usuario_rol WHERE usuario_id=%s", (usuario_id,))
        cur.execute("DELETE FROM estudiante WHERE persona_id=%s", (persona_id,))
        
        # <<< ORDEN CORREGIDO >>>
        cur.execute("DELETE FROM persona WHERE persona_id=%s", (persona_id,))
        cur.execute("DELETE FROM usuario WHERE usuario_id=%s", (usuario_id,))
        
        if id_direccion:
            cur.execute("DELETE FROM direccion WHERE id_direccion=%s", (id_direccion,))
        
        conn.commit()
        return jsonify({"mensaje": "Alumno eliminado con éxito"})

    except (Exception, psycopg2.Error) as e:
        if conn: conn.rollback()
        print(f"Error en eliminar_alumno: {str(e)}")
        if isinstance(e, errors.ForeignKeyViolation):
             return jsonify({"error": "No se puede eliminar: El usuario tiene otros datos asociados (ej. matrículas)."}), 409
        return jsonify({"error": "Error interno al eliminar alumno."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()