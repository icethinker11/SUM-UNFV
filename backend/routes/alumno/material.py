from flask import Blueprint, jsonify, send_file
from database.db import get_db
import os

material_bp = Blueprint('material', __name__)

UPLOAD_FOLDER = 'uploads/materiales'

@material_bp.route("/materiales/<int:estudiante_id>", methods=['GET'])
def obtener_materiales(estudiante_id):
    """
    Obtiene todo el material disponible para los cursos del estudiante
    """
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        query = """
            SELECT 
                mat.material_id,
                mat.titulo,
                mat.descripcion,
                mat.archivo_nombre,
                mat.archivo_ruta,
                mat.tipo_archivo,
                mat.fecha_subida,
                c.nombre as curso_nombre,
                c.codigo as curso_codigo,
                s.codigo as seccion_codigo,
                p.nombres as docente_nombres,
                p.apellidos as docente_apellidos
            FROM materiales mat
            JOIN asignaciones asig ON mat.asignacion_id = asig.asignacion_id
            JOIN curso c ON asig.curso_id = c.curso_id
            JOIN secciones s ON asig.seccion_id = s.seccion_id
            LEFT JOIN persona p ON asig.docente_id = p.persona_id
            WHERE asig.asignacion_id IN (
                SELECT m.asignacion_id 
                FROM matriculas m 
                WHERE m.estudiante_id = %s 
                AND m.estado = 'ACTIVA'
            )
            ORDER BY mat.fecha_subida DESC
        """
        
        cur.execute(query, (estudiante_id,))
        rows = cur.fetchall()
        
        materiales = []
        for row in rows:
            materiales.append({
                'material_id': row[0],
                'titulo': row[1],
                'descripcion': row[2],
                'archivo_nombre': row[3],
                'tipo_archivo': row[5],
                'fecha_subida': str(row[6]) if row[6] else None,
                'curso': {
                    'nombre': row[7],
                    'codigo': row[8],
                    'seccion': row[9]
                },
                'docente': f"{row[10]} {row[11]}" if row[10] else 'Sin asignar'
            })
        
        return jsonify({'materiales': materiales}), 200
        
    except Exception as e:
        print(f"❌ Error al obtener materiales: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@material_bp.route("/descargar/<archivo>", methods=['GET'])
def descargar_material(archivo):
    """
    Descarga un archivo de material
    """
    try:
        ruta_archivo = os.path.join(UPLOAD_FOLDER, archivo)
        if os.path.exists(ruta_archivo):
            return send_file(ruta_archivo, as_attachment=True)
        else:
            return jsonify({'error': 'Archivo no encontrado'}), 404
    except Exception as e:
        print(f"❌ Error al descargar material: {e}")
        return jsonify({'error': str(e)}), 500