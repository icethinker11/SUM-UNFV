from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_db
from datetime import datetime
from . import docentes_bp
import traceback

# ==========================================
# 🔹 AUDITORÍA
# ==========================================
def registrar_auditoria(docente_id, accion, tabla_afectada, registro_id=None, detalles=None):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO auditoria_docente (docente_id, accion, tabla_afectada, registro_id, detalles, ip_address, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            docente_id,
            accion,
            tabla_afectada,
            registro_id,
            str(detalles),
            request.remote_addr,
            datetime.utcnow()
        ))
        conn.commit()
        cur.close()
    except Exception:
        print("⚠️ Error al registrar auditoría:")
        print(traceback.format_exc())

# ==========================================
# 🔹 Calcular porcentaje de asistencia
# ==========================================
def calcular_porcentaje_asistencia(estudiante_id, curso_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) FROM asistencias WHERE estudiante_id=%s AND curso_id=%s
    """, (estudiante_id, curso_id))
    total_clases = cur.fetchone()[0]

    if total_clases == 0:
        cur.close()
        return 0

    cur.execute("""
        SELECT COUNT(*) FROM asistencias 
        WHERE estudiante_id=%s AND curso_id=%s AND estado='presente'
    """, (estudiante_id, curso_id))
    asistencias = cur.fetchone()[0]
    cur.close()
    return round((asistencias / total_clases) * 100, 2)

# ==========================================
# 🔹 Registrar asistencia
# ==========================================
@docentes_bp.route('/asistencia', methods=['POST'])
@jwt_required()
def registrar_asistencia():
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()

        curso_id = data.get("curso_id")
        fecha_clase = datetime.strptime(data["fecha_clase"], "%Y-%m-%d").date()
        asistencias = data.get("asistencias", [])

        if not curso_id or not asistencias:
            return jsonify({"error": "Datos incompletos"}), 400

        conn = get_db()
        cur = conn.cursor()

        estudiantes_registrados = []

        for asist in asistencias:
            estudiante_id = asist["estudiante_id"]
            estado = asist["estado"]
            observaciones = asist.get("observaciones", "")

            # Verificar si ya existe
            cur.execute("""
                SELECT asistencia_id FROM asistencias 
                WHERE estudiante_id=%s AND curso_id=%s AND fecha_clase=%s
            """, (estudiante_id, curso_id, fecha_clase))
            existente = cur.fetchone()

            if existente:
                cur.execute("""
                    UPDATE asistencias
                    SET estado=%s, observaciones=%s
                    WHERE asistencia_id=%s
                """, (estado, observaciones, existente[0]))
            else:
                cur.execute("""
                    INSERT INTO asistencias (estudiante_id, curso_id, docente_id, fecha_clase, estado, observaciones, fecha_registro)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    estudiante_id, curso_id, usuario_id, fecha_clase, estado, observaciones, datetime.utcnow()
                ))
            estudiantes_registrados.append(estudiante_id)

        conn.commit()

        # Calcular porcentajes
        porcentajes = {}
        estudiantes_bajo = []
        for eid in estudiantes_registrados:
            porcentaje = calcular_porcentaje_asistencia(eid, curso_id)
            porcentajes[eid] = porcentaje
            if porcentaje < 70:
                estudiantes_bajo.append({"estudiante_id": eid, "porcentaje": porcentaje})

        registrar_auditoria(
            docente_id=usuario_id,
            accion="registrar_asistencia",
            tabla_afectada="asistencias",
            detalles={
                "curso_id": curso_id,
                "fecha_clase": fecha_clase.isoformat(),
                "total_estudiantes": len(estudiantes_registrados)
            }
        )

        respuesta = {
            "mensaje": "Asistencias registradas correctamente",
            "porcentajes": porcentajes,
            "total_registrados": len(estudiantes_registrados)
        }
        if estudiantes_bajo:
            respuesta["alerta"] = "Alumnos con menos del 70% de asistencia"
            respuesta["estudiantes_bajo_porcentaje"] = estudiantes_bajo

        cur.close()
        return jsonify(respuesta), 201

    except Exception:
        if 'conn' in locals():
            conn.rollback()
        print("❌ Error en registrar_asistencia():")
        print(traceback.format_exc())
        return jsonify({"error": "Error al registrar asistencia"}), 500

# ==========================================
# 🔹 Obtener asistencias de un curso
# ==========================================
@docentes_bp.route('/asistencia/curso/<int:curso_id>', methods=['GET'])
@jwt_required()
def obtener_asistencias_curso(curso_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        fecha_inicio = request.args.get("fecha_inicio")
        fecha_fin = request.args.get("fecha_fin")

        query = "SELECT asistencia_id, estudiante_id, fecha_clase, estado, observaciones FROM asistencias WHERE curso_id=%s"
        params = [curso_id]

        if fecha_inicio:
            query += " AND fecha_clase >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND fecha_clase <= %s"
            params.append(fecha_fin)

        query += " ORDER BY fecha_clase DESC"

        cur.execute(query, tuple(params))
        registros = cur.fetchall()

        asistencias = {}
        for a in registros:
            fecha = a[2].isoformat()
            if fecha not in asistencias:
                asistencias[fecha] = []
            asistencias[fecha].append({
                "asistencia_id": a[0],
                "estudiante_id": a[1],
                "estado": a[3],
                "observaciones": a[4]
            })

        cur.close()
        return jsonify(asistencias), 200

    except Exception:
        print("❌ Error en obtener_asistencias_curso():")
        print(traceback.format_exc())
        return jsonify({"error": "Error interno al obtener asistencias"}), 500
