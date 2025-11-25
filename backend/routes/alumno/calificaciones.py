from flask import Blueprint, jsonify
from database.db import get_db

calificaciones_bp = Blueprint('calificaciones', __name__)

@calificaciones_bp.route("/mis-calificaciones/<int:estudiante_id>", methods=['GET'])
def obtener_mis_calificaciones(estudiante_id):
    """
    Obtiene todas las calificaciones del estudiante según tus tablas reales.
    """
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        query = """
        SELECT 
            cal.id,
            cal.estudiante_id,
            
            -- Estudiante (usa nombres, apellidos)
            p_est.nombres || ' ' || p_est.apellidos AS estudiante,
            
            -- Curso
            cal.curso_id,
            c.codigo AS curso_codigo,
            c.nombre AS curso_nombre,
            c.ciclo AS curso_ciclo,

            -- Docente (usa nombres, apellidos)
            cal.docente_id,
            p_doc.nombres || ' ' || p_doc.apellidos AS docente,

            -- Notas
            cal.practicas,
            cal.parcial,
            cal.final,
            cal.sustitutorio,
            cal.aplazado,
            cal.promedio,
            cal.estado,
            cal.fecha_registro,
            cal.fecha_modificacion

        FROM calificaciones cal
        JOIN estudiante e ON cal.estudiante_id = e.estudiante_id
        JOIN persona p_est ON e.persona_id = p_est.persona_id
        
        JOIN curso c ON cal.curso_id = c.curso_id
        
        JOIN docente d ON cal.docente_id = d.docente_id
        JOIN persona p_doc ON d.persona_id = p_doc.persona_id

        WHERE cal.estudiante_id = %s
        ORDER BY c.nombre;
        """
        
        cur.execute(query, (estudiante_id,))
        rows = cur.fetchall()

        calificaciones = []
        for row in rows:
            calificaciones.append({
                "id": row[0],
                "estudiante_id": row[1],
                "estudiante": row[2],
                "curso_id": row[3],
                "curso_codigo": row[4],
                "curso_nombre": row[5],
                "curso_ciclo": row[6],
                "docente_id": row[7],
                "docente": row[8],

                # Notas
                "practicas": float(row[9]) if row[9] is not None else None,
                "parcial": float(row[10]) if row[10] is not None else None,
                "final": float(row[11]) if row[11] is not None else None,
                "sustitutorio": float(row[12]) if row[12] is not None else None,
                "aplazado": float(row[13]) if row[13] is not None else None,
                "promedio": float(row[14]) if row[14] is not None else None,
                "estado": row[15],
                "fecha_registro": str(row[16]),
                "fecha_modificacion": str(row[17])
            })

        return jsonify({"calificaciones": calificaciones}), 200

    except Exception as e:
        print(f"❌ Error al obtener calificaciones: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
