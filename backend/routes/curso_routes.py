# routes/curso_routes.py
from flask import Blueprint, request, jsonify
from database.db import get_db
from psycopg2.extras import RealDictCursor
import re

curso_bp = Blueprint("curso", __name__)

# ===========================
# CREAR CURSO
# ===========================
@curso_bp.route("/crear", methods=["POST"])
def crear_curso():
    data = request.json
    codigo = data.get("codigo")
    nombre = data.get("nombre")
    creditos = data.get("creditos")
    ciclo = data.get("ciclo")  
    horas_teoricas = data.get("horasTeoricas")
    horas_practicas = data.get("horasPracticas")
    tipo = data.get("tipo")          
    usuario_creacion = data.get("usuario_creacion")

    try:
        # ======================================================
        # VALIDACIONES DEL CÓDIGO
        # ======================================================

        # ---- CASO 1: Curso electivo ----
        if tipo.lower() == "electivo":
            patron = r"^EL\d{3}(I|II|III|IV|V|VI|VII|VIII|IX|X)$"

            if not re.fullmatch(patron, codigo):
                return jsonify({
                    "error": "Formato electivo incorrecto. Ej: EL402VI ❌"
                }), 400

            if not ciclo:
                return jsonify({"error": "Ciclo inválido ❌"}), 400

            if not codigo.endswith(ciclo):
                return jsonify({
                    "error": f"El código debe terminar en {ciclo} según el ciclo seleccionado ❌"
                }), 400

        # ---- CASO 2: Curso NO electivo ----
        else:
            # No puede empezar con EL
            if codigo.startswith("EL"):
                return jsonify({
                    "error": "El código no puede comenzar con 'EL' para cursos no electivos ❌"
                }), 400

            # Solo números
            if not re.fullmatch(r"\d+", codigo):
                return jsonify({
                    "error": "El código del curso solo debe contener números ❌"
                }), 400

            # Longitud entre 1 y 7 dígitos
            if len(codigo) > 7:
                return jsonify({
                    "error": "El código solo puede tener como máximo 7 dígitos ❌"
                }), 400

            # Validar dígitos repetidos consecutivos (no más de 4 iguales)
            if re.search(r"(\d)\1{4,}", codigo):
                return jsonify({
                    "error": "El código no puede repetir un mismo número más de 4 veces consecutivas ❌"
                }), 400 

        # ======================================================
        # VALIDAR CRÉDITOS (1 dígito)
        # ======================================================
        if not re.fullmatch(r"[1-9]", str(creditos)):
            return jsonify({
                "error": "El número de créditos debe ser un solo dígito entre 1 y 9 ❌"
            }), 400

        # ======================================================
        # VALIDAR HORAS TEÓRICAS (1 dígito)
        # ======================================================
        if not re.fullmatch(r"[0-9]", str(horas_teoricas)):
            return jsonify({
                "error": "Las horas teóricas deben ser un solo dígito (0-9) ❌"
            }), 400

        # ======================================================
        # VALIDAR HORAS PRÁCTICAS (1 dígito)
        # ======================================================
        if not re.fullmatch(r"[0-9]", str(horas_practicas)):
            return jsonify({
                "error": "Las horas prácticas deben ser un solo dígito (0-9) ❌"
            }), 400

        # ======================================================
        # VALIDAR UNICIDAD DEL CÓDIGO
        # ======================================================
        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM curso WHERE codigo = %s", (codigo,))
        if cur.fetchone():
            return jsonify({"error": "El código del curso ya existe ❌"}), 400

        # ======================================================
        # INSERTAR CURSO
        # ======================================================
        cur.execute("""
            INSERT INTO curso (codigo, nombre, creditos, ciclo, horas_teoricas, horas_practicas, tipo, usuario_creacion)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING curso_id, nombre, codigo
        """, (codigo, nombre, creditos, ciclo, horas_teoricas, horas_practicas, tipo, usuario_creacion))

        nuevo = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"mensaje": "Curso creado con éxito ✅", "curso": nuevo}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===========================
# LISTAR TODOS LOS CURSOS (RUTA PRINCIPAL)
# ===========================
@curso_bp.route("/", methods=["GET"])
def listar_cursos():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT c.curso_id, c.codigo, c.nombre, c.creditos, c.ciclo, 
                   c.horas_teoricas, c.horas_practicas, c.tipo, c.estado, c.fecha_creacion
            FROM curso c
            ORDER BY c.nombre ASC
        """)
        
        cursos = cur.fetchall()
        return jsonify(cursos), 200
    
    except Exception as e:
        print(f"❌ Error en listar_cursos: {e}")
        return jsonify({"error": "Error interno al obtener la lista de cursos."}), 500
        
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ===========================
# OBTENER CURSO POR ID
# ===========================
@curso_bp.route("/<int:curso_id>", methods=["GET"])
def obtener_curso(curso_id):
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                curso_id, 
                codigo, 
                nombre, 
                creditos, 
                ciclo, 
                horas_teoricas, 
                horas_practicas, 
                tipo, 
                estado
            FROM curso 
            WHERE curso_id = %s
        """, (curso_id,))
        
        curso = cur.fetchone()
        cur.close()
        conn.close()
        
        if not curso:
            return jsonify({"error": "Curso no encontrado ❌"}), 404
            
        return jsonify(curso), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===========================
# ACTUALIZAR CURSO
# ===========================
@curso_bp.route("/actualizar/<int:curso_id>", methods=["PUT"])
def actualizar_curso(curso_id):
    data = request.json
    codigo = data.get("codigo")
    nombre = data.get("nombre")
    creditos = data.get("creditos")
    ciclo = data.get("ciclo")
    horas_teoricas = data.get("horas_teoricas")
    horas_practicas = data.get("horas_practicas")
    tipo = data.get("tipo")

    try:
        conn = get_db()
        cur = conn.cursor()

        # Verificar que el curso existe
        cur.execute("SELECT curso_id FROM curso WHERE curso_id = %s", (curso_id,))
        if not cur.fetchone():
            return jsonify({"error": "Curso no encontrado ❌"}), 404

        # Validar que el código no esté duplicado
        cur.execute("SELECT 1 FROM curso WHERE codigo = %s AND curso_id != %s", (codigo, curso_id))
        if cur.fetchone():
            return jsonify({"error": "El código del curso ya está en uso por otro curso ❌"}), 400

        # Actualizar el curso
        cur.execute("""
            UPDATE curso 
            SET 
                codigo = %s,
                nombre = %s,
                creditos = %s,
                ciclo = %s,
                horas_teoricas = %s,
                horas_practicas = %s,
                tipo = %s
            WHERE curso_id = %s
            RETURNING curso_id, codigo, nombre
        """, (codigo, nombre, creditos, ciclo, horas_teoricas, horas_practicas, tipo, curso_id))

        curso_actualizado = cur.fetchone()
        conn.commit()
        
        return jsonify({
            "mensaje": "Curso actualizado correctamente ✅",
            "curso_actualizado": {
                "curso_id": curso_actualizado[0],
                "codigo": curso_actualizado[1],
                "nombre": curso_actualizado[2]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ===========================
# ELIMINAR CURSO (CON ELIMINACIÓN EN CASCADA)
# ===========================
@curso_bp.route("/eliminar/<int:curso_id>", methods=["DELETE"])
def eliminar_curso(curso_id):
    """Elimina un curso y todas sus dependencias (asignaciones, secciones, matrículas, etc.)."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Verificar que el curso existe
        cur.execute("SELECT codigo, nombre FROM curso WHERE curso_id = %s", (curso_id,))
        curso = cur.fetchone()
        if not curso:
            return jsonify({"error": "El curso no existe"}), 404

        print(f"🗑️ Iniciando eliminación del curso: {curso[0]} - {curso[1]}")

        # 1️⃣ Eliminar matrículas de las secciones de este curso
        cur.execute("""
            DELETE FROM matriculas 
            WHERE asignacion_id IN (
                SELECT asignacion_id FROM asignaciones WHERE curso_id = %s
            )
        """, (curso_id,))
        matriculas_eliminadas = cur.rowcount
        print(f"   ✓ Matrículas eliminadas: {matriculas_eliminadas}")

        # 2️⃣ Eliminar asignaciones del curso
        cur.execute("DELETE FROM asignaciones WHERE curso_id = %s", (curso_id,))
        asignaciones_eliminadas = cur.rowcount
        print(f"   ✓ Asignaciones eliminadas: {asignaciones_eliminadas}")

        # 3️⃣ Eliminar secciones del curso (si existen)
        try:
            cur.execute("DELETE FROM seccion WHERE curso_id = %s", (curso_id,))
            secciones_eliminadas = cur.rowcount
            print(f"   ✓ Secciones eliminadas: {secciones_eliminadas}")
        except Exception as e:
            print(f"   ⚠️ No se encontraron secciones o no existen: {str(e)}")
            secciones_eliminadas = 0

        # 4️⃣ Eliminar prerrequisitos (donde este curso es requisito o es requerido)
        try:
            cur.execute("""
                DELETE FROM prerrequisito 
                WHERE id_curso = %s OR id_curso_requerido = %s
            """, (curso_id, curso_id))
            prerrequisitos_eliminados = cur.rowcount
            print(f"   ✓ Prerrequisitos eliminados: {prerrequisitos_eliminados}")
        except Exception as e:
            print(f"   ⚠️ No se encontraron prerrequisitos: {str(e)}")
            prerrequisitos_eliminados = 0

        # 5️⃣ Finalmente eliminar el curso
        cur.execute("DELETE FROM curso WHERE curso_id = %s", (curso_id,))
        print(f"   ✓ Curso eliminado exitosamente")

        conn.commit()
        
        return jsonify({
            "mensaje": "Curso y todas sus dependencias eliminadas exitosamente ✅",
            "detalles": {
                "matriculas_eliminadas": matriculas_eliminadas,
                "asignaciones_eliminadas": asignaciones_eliminadas,
                "secciones_eliminadas": secciones_eliminadas,
                "prerrequisitos_eliminados": prerrequisitos_eliminados
            }
        }), 200

    except Exception as e:
        if conn: 
            conn.rollback()
        print("❌ Error al eliminar curso:", str(e))
        return jsonify({"error": f"Error al eliminar: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ===========================
# CONSULTAR CURSOS CON FILTROS
# ===========================
@curso_bp.route("/listar", methods=["GET"])
def consultar_cursos():
    try:
        ciclo = request.args.get("ciclo")
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if ciclo:
            cur.execute("""
                SELECT c.curso_id, c.codigo, c.nombre, c.creditos, c.ciclo,
                       c.horas_teoricas, c.horas_practicas, c.tipo, c.estado, c.fecha_creacion
                FROM curso c
                WHERE c.ciclo = %s
                ORDER BY c.curso_id DESC
            """, (ciclo,))
        else:
            cur.execute("""
                SELECT c.curso_id, c.codigo, c.nombre, c.creditos, c.ciclo,
                       c.horas_teoricas, c.horas_practicas, c.tipo, c.estado, c.fecha_creacion
                FROM curso c
                ORDER BY c.curso_id DESC
            """)

        cursos = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(cursos), 200

    except Exception as e:
        print("Error en consultar_cursos:", e)
        return jsonify({"error": str(e)}), 500


# ===========================
# VERIFICAR SI TIENE ESTUDIANTES MATRICULADOS
# ===========================
@curso_bp.route("/<int:curso_id>/estudiantes", methods=["GET"])
def verificar_estudiantes_curso(curso_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT COUNT(DISTINCT m.estudiante_id) 
            FROM matricula m
            INNER JOIN seccion s ON m.seccion_id = s.seccion_id
            WHERE s.curso_id = %s AND m.estado = 'ACTIVO'
        """, (curso_id,))
        
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        
        return jsonify({"tiene_estudiantes": count > 0, "cantidad": count}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===========================
# VERIFICAR SI TIENE DOCENTE ASIGNADO
# ===========================
@curso_bp.route("/<int:curso_id>/docente", methods=["GET"])
def verificar_docente_curso(curso_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT COUNT(*) 
            FROM seccion 
            WHERE curso_id = %s 
              AND docente_id IS NOT NULL
              AND estado IN ('PROGRAMADO', 'EN CURSO')
        """, (curso_id,))
        
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        
        return jsonify({"tiene_docente": count > 0, "secciones": count}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===========================
# VERIFICAR SI TIENE ASIGNACIONES
# ===========================
@curso_bp.route("/<int:curso_id>/asignaciones", methods=["GET"])
def verificar_asignaciones(curso_id):
    """Verifica si el curso tiene asignaciones registradas."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            SELECT COUNT(*) FROM asignaciones 
            WHERE curso_id = %s
        """, (curso_id,))
        
        count = cur.fetchone()[0]
        tiene_asignaciones = count > 0

        return jsonify({
            "tiene_asignaciones": tiene_asignaciones,
            "cantidad": count
        }), 200

    except Exception as e:
        print("❌ Error al verificar asignaciones:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()