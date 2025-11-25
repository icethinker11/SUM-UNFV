from flask import Blueprint, jsonify
from database.db import get_db

horario_bp = Blueprint('horario', __name__)

@horario_bp.route("/mi-horario/<int:estudiante_id>", methods=['GET'])
def obtener_mi_horario(estudiante_id):
    """
    Obtiene el horario semanal del estudiante
    """
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        query = """
            SELECT 
                c.nombre as curso_nombre,
                c.codigo as curso_codigo,
                s.codigo as seccion_codigo,
                bh.dia,
                bh.hora_inicio,
                bh.hora_fin,
                bh.codigo_bloque,
                asig.aula_id,
                p.nombres as docente_nombres,
                p.apellidos as docente_apellidos
            FROM matriculas m
            JOIN estudiante e ON m.estudiante_id = e.estudiante_id
            JOIN asignaciones asig ON m.asignacion_id = asig.asignacion_id
            JOIN curso c ON asig.curso_id = c.curso_id
            JOIN secciones s ON asig.seccion_id = s.seccion_id
            LEFT JOIN bloque_horario bh ON asig.bloque_id = bh.bloque_id
            LEFT JOIN persona p ON asig.docente_id = p.persona_id
            WHERE e.estudiante_id = %s
            AND m.estado = 'ACTIVA'
            AND bh.bloque_id IS NOT NULL
            ORDER BY 
                CASE 
                    WHEN bh.dia = 'Lunes' THEN 1
                    WHEN bh.dia = 'Martes' THEN 2
                    WHEN bh.dia = 'Miercoles' OR bh.dia = 'Miércoles' THEN 3
                    WHEN bh.dia = 'Jueves' THEN 4
                    WHEN bh.dia = 'Viernes' THEN 5
                    WHEN bh.dia = 'Sabado' OR bh.dia = 'Sábado' THEN 6
                    WHEN bh.dia = 'Domingo' THEN 7
                    ELSE 8
                END,
                bh.hora_inicio
        """
        
        cur.execute(query, (estudiante_id,))
        rows = cur.fetchall()
        
        horario = []
        for row in rows:
            horario.append({
                'curso_nombre': row[0],
                'curso_codigo': row[1],
                'seccion': row[2],
                'dia': row[3],
                'hora_inicio': str(row[4]) if row[4] else None,
                'hora_fin': str(row[5]) if row[5] else None,
                'codigo_bloque': row[6],
                'aula_id': row[7],
                'docente': f"{row[8]} {row[9]}" if row[8] else 'Sin asignar'
            })
        
        return jsonify({'horario': horario}), 200
        
    except Exception as e:
        print(f"❌ Error al obtener horario: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()