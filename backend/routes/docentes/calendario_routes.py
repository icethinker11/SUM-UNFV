from flask import Blueprint, jsonify
from database.db import get_db

calendario_bp = Blueprint('calendario', __name__)

@calendario_bp.route("/horario/<int:docente_id>", methods=['GET'])
def horario_docente(docente_id):
    conn = None
    cur = None
    try:
        conn = get_db() 
        cur = conn.cursor()
        
        # Verificar si el docente tiene asignaciones
        cur.execute("SELECT COUNT(*) FROM asignaciones WHERE docente_id = %s", (docente_id,))
        count = cur.fetchone()[0]
        print(f"✅ Asignaciones encontradas para docente {docente_id}: {count}")
        
        # Consulta SQL con LEFT JOIN para incluir asignaciones sin bloque horario
        query = """
            SELECT 
                c.nombre AS curso,
                c.codigo AS codigo_curso,
                s.codigo AS seccion,
                bh.dia,
                bh.hora_inicio,
                bh.hora_fin,
                bh.codigo_bloque,
                a.aula_id,
                a.cantidad_estudiantes,
                a.bloque_id,
                CASE 
                    WHEN bh.bloque_id IS NULL THEN 'Sin horario asignado'
                    ELSE 'OK'
                END AS estado_bloque
            FROM asignaciones a
            JOIN curso c ON a.curso_id = c.curso_id 
            JOIN secciones s ON a.seccion_id = s.seccion_id
            LEFT JOIN bloque_horario bh ON a.bloque_id = bh.bloque_id
            WHERE a.docente_id = %s
            ORDER BY 
                CASE 
                    WHEN bh.dia = 'Lunes' THEN 1
                    WHEN bh.dia = 'Martes' THEN 2
                    WHEN bh.dia = 'Miercoles' THEN 3
                    WHEN bh.dia = 'Miércoles' THEN 3
                    WHEN bh.dia = 'Jueves' THEN 4
                    WHEN bh.dia = 'Viernes' THEN 5
                    WHEN bh.dia = 'Sábado' THEN 6
                    WHEN bh.dia = 'Sabado' THEN 6
                    WHEN bh.dia = 'Domingo' THEN 7
                    ELSE 8
                END,
                bh.hora_inicio NULLS LAST
        """
        
        cur.execute(query, (docente_id,))
        column_names = [desc[0] for desc in cur.description]
        rows = cur.fetchall()

        print(f"✅ Filas de horario encontradas: {len(rows)}")

        if not rows:
            return jsonify({
                'message': 'No se encontró horario para el docente.',
                'docente_id': docente_id
            }), 404

        # Convertir los resultados a lista de diccionarios
        horario = []
        for row in rows:
            item = dict(zip(column_names, row))
            # Convertir objetos time a strings
            if 'hora_inicio' in item and item['hora_inicio']:
                item['hora_inicio'] = str(item['hora_inicio'])
            if 'hora_fin' in item and item['hora_fin']:
                item['hora_fin'] = str(item['hora_fin'])
            horario.append(item)

        print(f"✅ Horario generado exitosamente con {len(horario)} bloques")
        return jsonify(horario), 200

    except Exception as e:
        print(f"❌ Error al obtener horario del docente {docente_id}:")
        print(f"   Tipo de error: {type(e).__name__}")
        print(f"   Mensaje: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Error al consultar el horario',
            'detalle': str(e)
        }), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@calendario_bp.route("/test-db", methods=['GET'])
def test_db():
    """Ruta de prueba para verificar la conexión a la base de datos"""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Probar consulta simple
        cur.execute("SELECT COUNT(*) FROM asignaciones")
        total = cur.fetchone()[0]
        
        return jsonify({
            'status': 'OK',
            'mensaje': 'Conexión exitosa',
            'total_asignaciones': total
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'error': str(e)
        }), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()