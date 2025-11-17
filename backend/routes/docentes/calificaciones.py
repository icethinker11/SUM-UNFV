from flask import Blueprint, request, jsonify
from database.db import get_db
from psycopg2.extras import RealDictCursor
from datetime import datetime

calificaciones_bp = Blueprint("calificaciones", __name__)

# ================================================
# ✅ Registrar o actualizar calificaciones
# ================================================
@calificaciones_bp.route("/registrar", methods=["POST"])
def registrar_calificacion():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    data = request.json

    try:
        estudiante_id = data["estudiante_id"]
        curso_id = data["curso_id"]
        docente_id = data["docente_id"]
        
        # 🚨 CORRECCIÓN CLAVE: Convertir las notas a float al obtenerlas.
        # Esto asegura que sean números para el cálculo del promedio.
        # Usamos float() para manejar notas decimales, y manejamos None o strings vacíos.
        
        def safe_float(value):
            if value is None or value == "":
                return 0.0
            # Si el valor es una cadena, intenta convertirla; si ya es un número, lo mantiene.
            try:
                return float(value)
            except ValueError:
                raise ValueError(f"El valor de calificación '{value}' no es un número válido.")

        practicas = safe_float(data.get("practicas"))
        parcial = safe_float(data.get("parcial"))
        final = safe_float(data.get("final"))
        sustitutorio = safe_float(data.get("sustitutorio"))
        
        # Puedes simplificar la recuperación si sabes que siempre vienen como string
        # practicas = float(data.get("practicas", 0)) 
        # PERO la función safe_float es más robusta si los datos pueden ser None/vacío.

        # Calcular promedio
        # Se calcula el promedio solo de las notas que son mayores a cero.
        notas = [practicas, parcial, final]
        
        # Filtramos para asegurarnos de que solo se promedian las notas válidas (distintas de 0)
        notas_validas = [n for n in notas if n > 0] 
        
        if notas_validas:
            promedio = sum(notas_validas) / len(notas_validas)
        else:
            promedio = 0.0 # Evitar división por cero si no hay notas válidas
            
        estado = "APROBADO" if promedio >= 11 else "DESAPROBADO"

        # Verificar si ya existe una calificación
        # ... [El resto de tu lógica de BD (SELECT, UPDATE, INSERT)]
        
        # ... El resto del código de la base de datos (SELECT, UPDATE, INSERT) se mantiene igual ...
        
        cur.execute("""
            SELECT id FROM calificaciones
            WHERE estudiante_id = %s AND curso_id = %s AND docente_id = %s
        """, (estudiante_id, curso_id, docente_id))
        existente = cur.fetchone()

        if existente:
            # 🔁 Actualizar si ya existe
            cur.execute("""
                UPDATE calificaciones
                SET practicas=%s, parcial=%s, final=%s, sustitutorio=%s, promedio=%s, estado=%s, fecha_modificacion=%s
                WHERE id=%s
            """, (
                practicas, parcial, final, sustitutorio, promedio, estado,
                datetime.now(), existente["id"]
            ))
            mensaje = "✅ Calificación actualizada correctamente"
        else:
            # 🆕 Insertar nueva calificación
            cur.execute("""
                INSERT INTO calificaciones (
                    estudiante_id, curso_id, docente_id, practicas, parcial, final, sustitutorio, promedio, estado
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                estudiante_id, curso_id, docente_id,
                practicas, parcial, final, sustitutorio, promedio, estado
            ))
            mensaje = "✅ Calificación registrada correctamente"

        conn.commit()
        return jsonify({"mensaje": mensaje, "promedio": promedio, "estado": estado}), 200

    except ValueError as ve:
        # Captura el error si la conversión a float falla
        conn.rollback()
        print("❌ Error de valor en calificación:", ve)
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        conn.rollback()
        print("❌ Error al registrar calificación:", e)
        return jsonify({"error": "Error interno del servidor al procesar la calificación."}), 500
    finally:
        cur.close()
        conn.close()


# ================================================
# 📋 Obtener lista de estudiantes del docente
# ================================================
@calificaciones_bp.route("/estudiantes/<int:docente_id>", methods=["GET"])
def obtener_estudiantes_docente(docente_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT DISTINCT
                e.estudiante_id,
                (p.nombres || ' ' || p.apellidos) AS nombre_completo,
                c.curso_id,
                c.nombre AS curso,
                s.codigo AS seccion
            FROM asignaciones a
            JOIN matriculas m ON a.asignacion_id = m.asignacion_id
            JOIN estudiante e ON m.estudiante_id = e.estudiante_id
            JOIN persona p ON e.persona_id = p.persona_id
            JOIN curso c ON a.curso_id = c.curso_id
            JOIN secciones s ON a.seccion_id = s.seccion_id
            WHERE a.docente_id = %s
            ORDER BY curso, nombre_completo
        """, (docente_id,))
        estudiantes = cur.fetchall()
        return jsonify(estudiantes)
    except Exception as e:
        print("❌ Error al obtener estudiantes:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ================================================
# 📚 Obtener cursos asignados al docente
# ================================================
@calificaciones_bp.route("/cursos/<int:docente_id>", methods=["GET"])
def obtener_cursos_docente(docente_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT DISTINCT
                a.asignacion_id,
                c.curso_id,
                c.nombre AS curso,
                s.codigo AS seccion,
                c.ciclo
            FROM asignaciones a
            JOIN curso c ON a.curso_id = c.curso_id
            JOIN secciones s ON a.seccion_id = s.seccion_id
            WHERE a.docente_id = %s
            ORDER BY c.ciclo, c.nombre
        """, (docente_id,))
        cursos = cur.fetchall()
        return jsonify(cursos)
    except Exception as e:
        print("❌ Error al obtener cursos del docente:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ================================================
# 👨‍🎓 Obtener estudiantes de un curso específico
# ================================================
@calificaciones_bp.route("/curso/<int:asignacion_id>/estudiantes", methods=["GET"])
def obtener_estudiantes_curso(asignacion_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT
                e.estudiante_id,
                (p.nombres || ' ' || p.apellidos) AS nombre_completo,
                c.nombre AS curso,
                s.codigo AS seccion
            FROM matriculas m
            JOIN estudiante e ON m.estudiante_id = e.estudiante_id
            JOIN persona p ON e.persona_id = p.persona_id
            JOIN asignaciones a ON m.asignacion_id = a.asignacion_id
            JOIN curso c ON a.curso_id = c.curso_id
            JOIN secciones s ON a.seccion_id = s.seccion_id
            WHERE a.asignacion_id = %s
            ORDER BY nombre_completo
        """, (asignacion_id,))
        estudiantes = cur.fetchall()
        return jsonify(estudiantes)
    except Exception as e:
        print("❌ Error al obtener estudiantes del curso:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ================================================
# 📝 Obtener todas las calificaciones de un curso y docente
# ================================================
@calificaciones_bp.route("/notas/<int:curso_id>/<int:docente_id>", methods=["GET"])
def obtener_notas_curso(curso_id, docente_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Busca todas las calificaciones que coincidan con el curso y el docente.
        # Asume que una calificación está ligada a un estudiante, curso y docente.
        cur.execute("""
            SELECT 
                cal.estudiante_id,
                cal.practicas,
                cal.parcial,
                cal.final,
                cal.promedio,
                cal.estado
            FROM calificaciones cal
            WHERE cal.curso_id = %s AND cal.docente_id = %s
        """, (curso_id, docente_id))
        
        notas = cur.fetchall()
        return jsonify(notas)
        
    except Exception as e:
        print("❌ Error al obtener notas del curso:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()