from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
from datetime import datetime
from database.db import get_db

calificaciones_bp = Blueprint("calificaciones", __name__)

# ----------------------------------------------
# 1️⃣ REGISTRAR / ACTUALIZAR CALIFICACIONES
# ----------------------------------------------
@calificaciones_bp.route("/registrar", methods=["POST"])
def registrar_calificacion():
    data = request.get_json()
    estudiante_id = data.get("estudiante_id")
    curso_id = data.get("curso_id")
    docente_id = data.get("docente_id")
    practicas = data.get("practicas", 0)
    parcial = data.get("parcial", 0)
    final = data.get("final", 0)
    sustitutorio = data.get("sustitutorio", 0)
    aplazado = data.get("aplazado", 0)

    promedio = max(final, sustitutorio)  # se queda con la mejor nota
    promedio = (practicas + parcial + promedio) / 3
    estado = "APROBADO" if promedio >= 11 else "DESAPROBADO"

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO calificaciones (
                estudiante_id, curso_id, docente_id,
                practicas, parcial, final, sustitutorio, aplazado, promedio, estado, fecha_registro
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (estudiante_id, curso_id) DO UPDATE
            SET practicas = EXCLUDED.practicas,
                parcial = EXCLUDED.parcial,
                final = EXCLUDED.final,
                sustitutorio = EXCLUDED.sustitutorio,
                aplazado = EXCLUDED.aplazado,
                promedio = EXCLUDED.promedio,
                estado = EXCLUDED.estado,
                fecha_modificacion = NOW();
        """, (
            estudiante_id, curso_id, docente_id,
            practicas, parcial, final, sustitutorio, aplazado,
            promedio, estado, datetime.now()
        ))

        conn.commit()
        return jsonify({"mensaje": f"✅ Calificación registrada ({estado})"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ----------------------------------------------
# 2️⃣ LISTAR CALIFICACIONES DE UN DOCENTE
# ----------------------------------------------
@calificaciones_bp.route("/docente/<int:docente_id>", methods=["GET"])
def listar_calificaciones_docente(docente_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT c.id, c.promedio, c.estado,
                   e.estudiante_id, p.nombres, p.apellidos,
                   cu.nombre AS curso
            FROM calificaciones c
            JOIN estudiante e ON c.estudiante_id = e.estudiante_id
            JOIN persona p ON e.persona_id = p.persona_id
            JOIN curso cu ON c.curso_id = cu.curso_id
            WHERE c.docente_id = %s
        """, (docente_id,))
        data = cur.fetchall()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
