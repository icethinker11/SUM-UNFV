from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from database.db import get_db
from . import docentes_bp
import traceback

# ================================
# 🔹 Reporte general del curso
# ================================
@docentes_bp.route('/reportes/resumen/<int:curso_id>', methods=['GET'])
@jwt_required()
def generar_reporte_resumen(curso_id):
    """Generar resumen del curso"""
    try:
        usuario_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor()

        # Verificar que el docente tenga el curso asignado
        cur.execute("""
            SELECT COUNT(*) 
            FROM cursos c
            JOIN cursos_docentes cd ON c.curso_id = cd.curso_id
            WHERE cd.docente_id = %s AND c.curso_id = %s
        """, (usuario_id, curso_id))
        if cur.fetchone()[0] == 0:
            return jsonify({'error': 'No tienes permisos para este curso'}), 403

        # Total de estudiantes matriculados
        cur.execute("SELECT COUNT(*) FROM matriculas WHERE curso_id = %s", (curso_id,))
        total_estudiantes = cur.fetchone()[0]

        # Total de materiales subidos
        cur.execute("SELECT COUNT(*) FROM materiales_didacticos WHERE curso_id = %s", (curso_id,))
        total_materiales = cur.fetchone()[0]

        # Estadísticas de calificaciones
        cur.execute("""
            SELECT AVG(nota), MAX(nota), MIN(nota),
                   COUNT(CASE WHEN nota >= 11 THEN 1 END),
                   COUNT(CASE WHEN nota < 11 THEN 1 END)
            FROM calificaciones
            WHERE curso_id = %s
        """, (curso_id,))
        cal_stats = cur.fetchone()
        promedio, nota_max, nota_min, aprobados, desaprobados = [x or 0 for x in cal_stats]

        # Total de clases dictadas (por fecha única)
        cur.execute("""
            SELECT COUNT(DISTINCT fecha_clase)
            FROM asistencias
            WHERE curso_id = %s
        """, (curso_id,))
        total_clases = cur.fetchone()[0] or 0

        # Datos del curso
        cur.execute("""
            SELECT curso_id, nombre, codigo, creditos
            FROM cursos
            WHERE curso_id = %s
        """, (curso_id,))
        curso = cur.fetchone()

        cur.close()

        reporte = {
            'curso': {
                'curso_id': curso[0],
                'nombre': curso[1],
                'codigo': curso[2],
                'creditos': curso[3]
            },
            'estudiantes': {'total': total_estudiantes},
            'calificaciones': {
                'total_registradas': aprobados + desaprobados,
                'promedio_general': round(float(promedio), 2) if promedio else 0,
                'nota_maxima': float(nota_max),
                'nota_minima': float(nota_min),
                'aprobados': int(aprobados),
                'desaprobados': int(desaprobados)
            },
            'asistencia': {'total_clases': total_clases},
            'materiales': {'total_subidos': total_materiales},
            'fecha_generacion': datetime.utcnow().isoformat()
        }

        return jsonify(reporte), 200

    except Exception as e:
        print("❌ Error en generar_reporte_resumen():")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ================================
# 🔹 Reporte de bajo rendimiento
# ================================
@docentes_bp.route('/reportes/bajo-rendimiento/<int:curso_id>', methods=['GET'])
@jwt_required()
def reporte_bajo_rendimiento(curso_id):
    """Generar reporte de estudiantes con bajo rendimiento"""
    try:
        usuario_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor()

        # Verificar permiso del docente
        cur.execute("""
            SELECT COUNT(*) FROM cursos_docentes
            WHERE docente_id = %s AND curso_id = %s
        """, (usuario_id, curso_id))
        if cur.fetchone()[0] == 0:
            return jsonify({'error': 'No tienes permisos para este curso'}), 403

        # Obtener estudiantes del curso
        cur.execute("""
            SELECT u.usuario_id, u.nombre, u.apellidos, u.email
            FROM usuarios u
            JOIN matriculas m ON u.usuario_id = m.estudiante_id
            WHERE m.curso_id = %s
        """, (curso_id,))
        estudiantes = cur.fetchall()

        estudiantes_riesgo = []

        for est in estudiantes:
            estudiante_id, nombre, apellidos, email = est

            # Promedio de notas
            cur.execute("""
                SELECT AVG(nota) FROM calificaciones
                WHERE estudiante_id = %s AND curso_id = %s
            """, (estudiante_id, curso_id))
            promedio = cur.fetchone()[0] or 0

            # Porcentaje de asistencia
            cur.execute("""
                SELECT COUNT(*), COUNT(CASE WHEN estado = 'presente' THEN 1 END)
                FROM asistencias
                WHERE estudiante_id = %s AND curso_id = %s
            """, (estudiante_id, curso_id))
            total, presentes = cur.fetchone()
            porcentaje_asistencia = (presentes / total * 100) if total > 0 else 0

            if promedio < 11 or porcentaje_asistencia < 70:
                estudiantes_riesgo.append({
                    'estudiante_id': estudiante_id,
                    'nombre': f"{nombre} {apellidos}",
                    'email': email,
                    'promedio_notas': round(float(promedio), 2),
                    'porcentaje_asistencia': round(porcentaje_asistencia, 2),
                    'estado': 'crítico' if promedio < 11 and porcentaje_asistencia < 70 else 'alerta'
                })

        # Ordenar: críticos primero
        estudiantes_riesgo.sort(key=lambda x: (x['estado'] == 'alerta', x['promedio_notas']))

        cur.close()

        return jsonify({
            'total_estudiantes_riesgo': len(estudiantes_riesgo),
            'estudiantes': estudiantes_riesgo,
            'fecha_generacion': datetime.utcnow().isoformat()
        }), 200

    except Exception:
        print("❌ Error en reporte_bajo_rendimiento():")
        print(traceback.format_exc())
        return jsonify({'error': 'Error generando el reporte'}), 500


# ================================
# 🔹 Reporte de calificaciones detalladas
# ================================
@docentes_bp.route('/reportes/calificaciones/<int:curso_id>', methods=['GET'])
@jwt_required()
def reporte_calificaciones_detallado(curso_id):
    """Generar reporte detallado de calificaciones"""
    try:
        usuario_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor()

        # Verificar permisos
        cur.execute("""
            SELECT COUNT(*) FROM cursos_docentes
            WHERE docente_id = %s AND curso_id = %s
        """, (usuario_id, curso_id))
        if cur.fetchone()[0] == 0:
            return jsonify({'error': 'No tienes permisos para este curso'}), 403

        # Obtener todos los estudiantes y sus calificaciones
        cur.execute("""
            SELECT u.usuario_id, u.nombre, u.apellidos, u.email,
                   c.periodo, c.nota
            FROM usuarios u
            JOIN matriculas m ON u.usuario_id = m.estudiante_id
            LEFT JOIN calificaciones c ON u.usuario_id = c.estudiante_id AND c.curso_id = m.curso_id
            WHERE m.curso_id = %s
            ORDER BY u.apellidos, u.nombre
        """, (curso_id,))
        filas = cur.fetchall()

        # Agrupar por estudiante
        estudiantes = {}
        for row in filas:
            est_id, nombre, apellidos, email, periodo, nota = row
            if est_id not in estudiantes:
                estudiantes[est_id] = {
                    'estudiante_id': est_id,
                    'nombre': f"{nombre} {apellidos}",
                    'email': email,
                    'calificaciones': {},
                    'notas': []
                }
            if periodo:
                estudiantes[est_id]['calificaciones'][periodo] = float(nota)
                estudiantes[est_id]['notas'].append(float(nota))

        # Calcular promedio y estado
        reporte_estudiantes = []
        for est in estudiantes.values():
            notas = est['notas']
            promedio = sum(notas) / len(notas) if notas else 0
            est['promedio'] = round(promedio, 2)
            est['estado'] = "Aprobado" if promedio >= 11 else "Desaprobado"
            reporte_estudiantes.append(est)

        # Ordenar por promedio descendente
        reporte_estudiantes.sort(key=lambda x: x['promedio'], reverse=True)

        # Datos del curso
        cur.execute("SELECT curso_id, nombre, codigo FROM cursos WHERE curso_id = %s", (curso_id,))
        curso = cur.fetchone()
        cur.close()

        return jsonify({
            'curso': {
                'curso_id': curso[0],
                'nombre': curso[1],
                'codigo': curso[2]
            },
            'estudiantes': reporte_estudiantes,
            'fecha_generacion': datetime.utcnow().isoformat()
        }), 200

    except Exception:
        print("❌ Error en reporte_calificaciones_detallado():")
        print(traceback.format_exc())
        return jsonify({'error': 'Error generando el reporte de calificaciones'}), 500
