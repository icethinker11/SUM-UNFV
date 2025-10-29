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
    if not telefono:
        return False
    return bool(re.fullmatch(r'\d{9}', telefono))

def validar_dni(dni):
    """Valida que el DNI tenga exactamente 8 dígitos"""
    if not dni:
        return False
    return bool(re.fullmatch(r'\d{8}', dni))

# ===========================
# CREAR ALUMNO
# ===========================
@alumnos_bp.route("/crear-alumno", methods=["POST"])
def crear_alumno():
    """
    Crea un nuevo alumno en el sistema según la estructura real de la BD.
    """
    print("=" * 50)
    print("🔵 INICIO - Crear Alumno")
    print("=" * 50)
    
    if not request.json:
        print("❌ No se recibió JSON")
        return jsonify({"error": "No se recibieron datos"}), 400
    
    data = request.json
    print(f"📨 Datos recibidos: {data}")
    
    # Capturar datos del formulario (NOMBRES CORRECTOS del frontend)
    correo_institucional = data.get("correo_institucional")
    correo_personal = data.get("correo_personal")
    nombres = data.get("nombres")
    apellido_paterno = data.get("apellido_paterno")
    apellido_materno = data.get("apellido_materno")
    dni = data.get("dni")
    telefono = data.get("telefono")
    codigo = data.get("codigo_universitario")
    ciclo_ingreso = data.get("ciclo_ingreso")
    escuela_id = data.get("escuela_id", 1)

    # Validaciones
    if not all([correo_institucional, nombres, apellido_paterno, apellido_materno, dni, telefono, codigo, ciclo_ingreso]):
        campos_faltantes = []
        if not correo_institucional: campos_faltantes.append("correo_institucional")
        if not nombres: campos_faltantes.append("nombres")
        if not apellido_paterno: campos_faltantes.append("apellido_paterno")
        if not apellido_materno: campos_faltantes.append("apellido_materno")
        if not dni: campos_faltantes.append("dni")
        if not telefono: campos_faltantes.append("telefono")
        if not codigo: campos_faltantes.append("codigo_universitario")
        if not ciclo_ingreso: campos_faltantes.append("ciclo_ingreso")
        
        print(f"❌ Campos faltantes: {campos_faltantes}")
        return jsonify({"error": f"Campos faltantes: {', '.join(campos_faltantes)}"}), 400
        
    if not validar_correo(correo_institucional, "Alumno"):
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

        # Verificar duplicados
        print("🔍 Verificando duplicados...")
        
        cur.execute("SELECT codigo_universitario FROM estudiante WHERE codigo_universitario = %s", (codigo,))
        if cur.fetchone():
            return jsonify({"error": "El código universitario ya está registrado"}), 400

        cur.execute("SELECT correo FROM usuario WHERE correo = %s", (correo_institucional,))
        if cur.fetchone():
            return jsonify({"error": "El correo institucional ya está registrado"}), 400

        cur.execute("SELECT dni FROM persona WHERE dni = %s", (dni,))
        if cur.fetchone():
            return jsonify({"error": "El DNI ya está registrado"}), 400

        # Generar contraseña temporal
        contrasena_temp = dni[-4:]
        contrasena_hash = hash_password(contrasena_temp)

        # 1️⃣ Insertar usuario
        print("➡️ Insertando usuario...")
        cur.execute("""
            INSERT INTO usuario (correo, contrasena, estado) 
            VALUES (%s, %s, 'ACTIVO') 
            RETURNING usuario_id
        """, (correo_institucional, contrasena_hash))
        usuario_id = cur.fetchone()[0]
        print(f"✅ Usuario ID: {usuario_id}")

        # 2️⃣ Asignar rol
        print("➡️ Asignando rol...")
        cur.execute("""
            SELECT rol_id FROM rol 
            WHERE LOWER(nombre_rol) IN ('alumno', 'estudiante')
        """)
        rol = cur.fetchone()
        if not rol:
            raise Exception("No se encontró el rol de Estudiante/Alumno en la base de datos")
        
        rol_id = rol[0]
        cur.execute("""
            INSERT INTO usuario_rol (usuario_id, rol_id)
            VALUES (%s, %s)
        """, (usuario_id, rol_id))
        print(f"✅ Rol asignado: {rol_id}")

        # 3️⃣ Insertar persona
        print("➡️ Insertando persona...")
        apellidos = f"{apellido_paterno} {apellido_materno}"
        cur.execute("""
            INSERT INTO persona (usuario_id, nombres, apellidos, dni, telefono) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING persona_id
        """, (usuario_id, nombres, apellidos, dni, telefono))
        persona_id = cur.fetchone()[0]
        print(f"✅ Persona ID: {persona_id}")

        # 4️⃣ Insertar estudiante
        print("➡️ Insertando estudiante...")
        cur.execute("""
            INSERT INTO estudiante (codigo_universitario, escuela_id, persona_id)
            VALUES (%s, %s, %s)
        """, (codigo, escuela_id, persona_id))
        print("✅ Estudiante creado")

        conn.commit()
        print("✅ COMMIT exitoso")

        # 📧 Enviar correo de bienvenida con credenciales
        print("=" * 50)
        print("🔵 INICIANDO ENVÍO DE CORREO")
        print("=" * 50)
        
        try:
            from .helpers import enviar_credenciales_estudiante
            print("✅ Función importada correctamente")
            
            nombre_completo = f"{nombres} {apellido_paterno} {apellido_materno}"
            
            print(f"📧 Correo destino: {correo_personal}")
            print(f"👤 Nombre completo: {nombre_completo}")
            print(f"📬 Correo institucional: {correo_institucional}")
            print(f"🔑 Contraseña temporal: {contrasena_temp}")
            print(f"🎓 Código universitario: {codigo}")
            
            envio_exitoso = enviar_credenciales_estudiante(
                correo_destino=correo_personal,
                nombre_completo=nombre_completo,
                correo_institucional=correo_institucional,
                contrasena_temporal=contrasena_temp,
                codigo_universitario=codigo
            )
            
            print(f"📊 Resultado del envío: {envio_exitoso}")
            
            if envio_exitoso:
                print(f"✅ Correo enviado exitosamente a {correo_personal}")
            else:
                print(f"⚠️ Advertencia: El estudiante fue creado pero no se pudo enviar el correo")
                
        except ImportError as ie:
            print(f"❌ ERROR DE IMPORTACIÓN: {str(ie)}")
            import traceback
            traceback.print_exc()
            envio_exitoso = False
        except Exception as e:
            print(f"❌ ERROR GENERAL AL ENVIAR CORREO: {str(e)}")
            import traceback
            traceback.print_exc()
            envio_exitoso = False

        print("=" * 50)
        print("🟢 FIN - Alumno creado exitosamente")
        print("=" * 50)

        return jsonify({
            "mensaje": "Estudiante registrado exitosamente",
            "correo_enviado": envio_exitoso,
            "datos": {
                "usuario_id": usuario_id,
                "codigo_universitario": codigo,
                "correo_institucional": correo_institucional,
                "contrasena_temporal": contrasena_temp  # Solo para desarrollo
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error al registrar estudiante: {str(e)}"}), 500
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
    """Obtiene la lista completa de alumnos ACTIVOS"""
    conn = None
    cur = None
    
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                e.estudiante_id,
                e.codigo_universitario,
                p.nombres,
                p.apellidos,
                p.dni,
                p.telefono,
                u.correo AS correo_institucional,
                esc.nombre_escuela,
                esc.facultad,
                u.estado
            FROM estudiante e
            JOIN persona p ON e.persona_id = p.persona_id
            JOIN usuario u ON p.usuario_id = u.usuario_id
            JOIN escuela esc ON e.escuela_id = esc.escuela_id
            WHERE u.estado = 'ACTIVO'
            ORDER BY p.apellidos, p.nombres
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
@alumnos_bp.route("/alumnos/<int:estudiante_id>", methods=["GET"])
def obtener_alumno(estudiante_id):
    """Obtiene los detalles de un alumno específico"""
    conn = None
    cur = None
    
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                e.estudiante_id,
                e.codigo_universitario,
                p.nombres,
                p.apellidos,
                p.dni,
                p.telefono,
                u.correo AS correo_institucional,
                e.escuela_id,
                esc.nombre_escuela,
                esc.facultad
            FROM estudiante e
            JOIN persona p ON e.persona_id = p.persona_id
            JOIN usuario u ON p.usuario_id = u.usuario_id
            LEFT JOIN escuela esc ON e.escuela_id = esc.escuela_id
            WHERE e.estudiante_id = %s
        """, (estudiante_id,))
        
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
# OBTENER ESCUELAS
# ===========================
@alumnos_bp.route("/escuelas", methods=["GET"])
def obtener_escuelas():
    """Obtiene la lista de todas las escuelas"""
    conn = None
    cur = None
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("SELECT escuela_id, nombre_escuela, facultad FROM escuela ORDER BY nombre_escuela")
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

# ===========================
# MODIFICAR ALUMNO
# ===========================
@alumnos_bp.route("/alumnos/<int:estudiante_id>", methods=["PUT"])
def modificar_alumno(estudiante_id):
    """
    Actualiza la información de un alumno existente.
    """
    print("=" * 50)
    print(f"🔵 INICIO - Modificar Alumno ID: {estudiante_id}")
    print("=" * 50)
    
    if not request.json:
        return jsonify({"error": "No se recibieron datos"}), 400
    
    data = request.json
    print(f"📨 Datos recibidos: {data}")
    
    # Capturar datos
    nombres = data.get("nombres")
    apellido_paterno = data.get("apellido_paterno")
    apellido_materno = data.get("apellido_materno")
    dni = data.get("dni")
    telefono = data.get("telefono")
    codigo = data.get("codigo_universitario")
    correo_institucional = data.get("correo_institucional")

    # Validaciones
    if not all([nombres, apellido_paterno, apellido_materno, dni, telefono, codigo, correo_institucional]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400
        
    if not validar_correo(correo_institucional, "Alumno"):
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

        # Verificar que el estudiante existe
        print(f"🔍 Verificando existencia del estudiante ID: {estudiante_id}")
        cur.execute("""
            SELECT e.persona_id, p.usuario_id, e.codigo_universitario, u.correo, p.dni
            FROM estudiante e
            JOIN persona p ON e.persona_id = p.persona_id
            JOIN usuario u ON p.usuario_id = u.usuario_id
            WHERE e.estudiante_id = %s
        """, (estudiante_id,))
        
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Estudiante no encontrado"}), 404
        
        persona_id, usuario_id, codigo_actual, correo_actual, dni_actual = result
        print(f"✅ Estudiante encontrado - Persona ID: {persona_id}, Usuario ID: {usuario_id}")

        # Verificar duplicados SOLO si los valores cambiaron
        
        # Código universitario
        if codigo != codigo_actual:
            print(f"🔍 Verificando código universitario: {codigo}")
            cur.execute("""
                SELECT estudiante_id FROM estudiante 
                WHERE codigo_universitario = %s AND estudiante_id != %s
            """, (codigo, estudiante_id))
            if cur.fetchone():
                return jsonify({"error": "El código universitario ya está registrado por otro estudiante"}), 400

        # Correo institucional
        if correo_institucional != correo_actual:
            print(f"🔍 Verificando correo: {correo_institucional}")
            cur.execute("""
                SELECT usuario_id FROM usuario 
                WHERE correo = %s AND usuario_id != %s
            """, (correo_institucional, usuario_id))
            if cur.fetchone():
                return jsonify({"error": "El correo institucional ya está registrado por otro estudiante"}), 400

        # DNI
        if dni != dni_actual:
            print(f"🔍 Verificando DNI: {dni}")
            cur.execute("""
                SELECT persona_id FROM persona 
                WHERE dni = %s AND persona_id != %s
            """, (dni, persona_id))
            if cur.fetchone():
                return jsonify({"error": "El DNI ya está registrado por otro estudiante"}), 400

        # 1️⃣ Actualizar correo en usuario
        if correo_institucional != correo_actual:
            print("➡️ Actualizando correo...")
            cur.execute("""
                UPDATE usuario SET correo = %s WHERE usuario_id = %s
            """, (correo_institucional, usuario_id))

        # 2️⃣ Actualizar persona
        print("➡️ Actualizando datos de persona...")
        apellidos = f"{apellido_paterno} {apellido_materno}"
        cur.execute("""
            UPDATE persona 
            SET nombres = %s, apellidos = %s, dni = %s, telefono = %s
            WHERE persona_id = %s
        """, (nombres, apellidos, dni, telefono, persona_id))

        # 3️⃣ Actualizar código universitario
        if codigo != codigo_actual:
            print("➡️ Actualizando código universitario...")
            cur.execute("""
                UPDATE estudiante 
                SET codigo_universitario = %s
                WHERE estudiante_id = %s
            """, (codigo, estudiante_id))

        conn.commit()
        print("✅ COMMIT exitoso")

        print("=" * 50)
        print("🟢 FIN - Estudiante actualizado exitosamente")
        print("=" * 50)

        return jsonify({
            "mensaje": "Estudiante actualizado correctamente",
            "datos": {
                "estudiante_id": estudiante_id,
                "codigo_universitario": codigo,
                "correo_institucional": correo_institucional
            }
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error al actualizar estudiante: {str(e)}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ===========================
# ELIMINAR ALUMNO (DESACTIVAR)
# ===========================
@alumnos_bp.route("/alumnos/<int:estudiante_id>", methods=["DELETE"])
def eliminar_alumno(estudiante_id):
    """
    Desactiva un estudiante del sistema (no elimina físicamente).
    """
    print("=" * 50)
    print(f"🔵 INICIO - Eliminar Alumno ID: {estudiante_id}")
    print("=" * 50)
    
    conn = None
    cur = None

    try:
        conn = get_db()
        cur = conn.cursor()

        # Verificar que el estudiante existe
        print(f"🔍 Verificando existencia del estudiante ID: {estudiante_id}")
        cur.execute("""
            SELECT e.persona_id, p.usuario_id, p.nombres, p.apellidos
            FROM estudiante e
            JOIN persona p ON e.persona_id = p.persona_id
            WHERE e.estudiante_id = %s
        """, (estudiante_id,))
        
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Estudiante no encontrado"}), 404
        
        persona_id, usuario_id, nombres, apellidos = result
        print(f"✅ Estudiante encontrado: {nombres} {apellidos}")
        print(f"   Persona ID: {persona_id}, Usuario ID: {usuario_id}")

        # Desactivar usuario (método recomendado - mantiene historial)
        print("➡️ Desactivando usuario...")
        cur.execute("""
            UPDATE usuario 
            SET estado = 'INACTIVO'
            WHERE usuario_id = %s
        """, (usuario_id,))

        conn.commit()
        print("✅ COMMIT exitoso")

        print("=" * 50)
        print("🟢 FIN - Estudiante desactivado exitosamente")
        print("=" * 50)

        return jsonify({
            "mensaje": "Estudiante eliminado correctamente",
            "estudiante_id": estudiante_id
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error al eliminar estudiante: {str(e)}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()