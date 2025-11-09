from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
from database.db import get_db

# ✅ Este blueprint se registrará bajo /admin (ejemplo: /admin/cursos)
asignaciones_bp = Blueprint("asignaciones", __name__)

# -----------------------------
# LISTAR CURSOS
# -----------------------------
@asignaciones_bp.route("/cursos", methods=["GET"])
def listar_cursos():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT curso_id, codigo, nombre, creditos, ciclo, tipo
        FROM curso
        WHERE estado = TRUE
        ORDER BY nombre ASC
    """)
    cursos = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(cursos)


# -----------------------------
# LISTAR DOCENTES
# -----------------------------
@asignaciones_bp.route("/docentes", methods=["GET"])
def listar_docentes():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                d.docente_id,
                (p.nombres || ' ' || p.apellidos) AS nombre_completo,
                u.correo AS correo_docente
            FROM docente d
            JOIN persona p ON d.persona_id = p.persona_id
            JOIN usuario u ON p.usuario_id = u.usuario_id
            WHERE d.estado = TRUE
            ORDER BY p.apellidos ASC
        """)
        docentes = cur.fetchall()
        return jsonify(docentes)
    finally:
        cur.close()
        conn.close()

# -----------------------------
# LISTAR SECCIONES (A/B/C + periodo)
# -----------------------------
@asignaciones_bp.route("/secciones", methods=["GET"])
def listar_secciones():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT seccion_id, codigo, ciclo_academico, periodo
        FROM secciones
        WHERE UPPER(estado) = 'ACTIVO'
        ORDER BY periodo DESC, codigo ASC
    """)
    secciones = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(secciones)


# -----------------------------
# LISTAR HORARIOS (TO_CHAR para TIME)
# -----------------------------
@asignaciones_bp.route("/horarios", methods=["GET"])
def listar_horarios():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT 
            bloque_id,
            codigo_bloque,
            dia,
            TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
            TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin,
            CONCAT(dia, ' ', TO_CHAR(hora_inicio, 'HH24:MI'), '-', TO_CHAR(hora_fin, 'HH24:MI')) AS descripcion
        FROM bloque_horario
        WHERE UPPER(estado) = 'ACTIVO'
        ORDER BY dia, hora_inicio
    """)
    horarios = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(horarios)


# -----------------------------
# LISTAR AULAS OPERATIVAS
# -----------------------------
@asignaciones_bp.route("/aulas", methods=["GET"])
def listar_aulas():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT 
                a.aula_id,
                a.nombre_aula AS nombre,
                a.capacidad,
                p.nombre_pabellon AS pabellon,
                ta.nombre_tipo AS tipo_aula
            FROM aula a
            JOIN pabellon p ON a.pabellon_id = p.pabellon_id
            JOIN tipo_aula_cat ta ON a.tipo_aula_id = ta.tipo_aula_id
            WHERE UPPER(a.estado) = 'OPERATIVO'
            ORDER BY p.nombre_pabellon, a.nombre_aula
        """)
        aulas = cur.fetchall()
        return jsonify(aulas)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@asignaciones_bp.route("/crear-asignacion", methods=["POST"])
def crear_asignacion():
    data = request.get_json() or {}

    curso_id = data.get("curso_id")
    seccion_id = data.get("seccion_id")
    docente_id = data.get("docente_id")
    cantidad_estudiantes = data.get("estudiantes")
    observaciones = data.get("observaciones", "")
    bloque_id = data.get("horario_id")
    aula_id = data.get("aula_id")

    # ✅ Validar campos obligatorios
    if not all([curso_id, seccion_id, docente_id, cantidad_estudiantes, bloque_id, aula_id]):
        return jsonify({"error": "⚠️ Faltan campos obligatorios"}), 400

    # ✅ Validar tipo y rango de estudiantes
    try:
        cantidad_estudiantes = int(cantidad_estudiantes)
        if cantidad_estudiantes <= 0:
            return jsonify({"error": "⚠️ La cantidad de estudiantes debe ser mayor que 0."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "⚠️ La cantidad de estudiantes debe ser un número válido."}), 400

    conn = get_db()
    cur = conn.cursor()

    try:
        # ✅ Validar que la sección esté activa
        cur.execute("SELECT 1 FROM secciones WHERE seccion_id=%s AND UPPER(estado)='ACTIVO'", (seccion_id,))
        if not cur.fetchone():
            return jsonify({"error": "La sección seleccionada no está activa."}), 400

        # ✅ Validar que el bloque horario esté activo
        cur.execute("SELECT 1 FROM bloque_horario WHERE bloque_id=%s AND UPPER(estado)='ACTIVO'", (bloque_id,))
        if not cur.fetchone():
            return jsonify({"error": "El bloque horario no está activo o no existe."}), 400

        # ✅ Validar aula operativa y capacidad
        cur.execute("SELECT capacidad FROM aula WHERE aula_id=%s AND UPPER(estado)='OPERATIVO'", (aula_id,))
        aula = cur.fetchone()
        if not aula:
            return jsonify({"error": "El aula seleccionada no está operativa o no existe."}), 400

        capacidad_aula = aula[0]
        if cantidad_estudiantes > capacidad_aula:
            return jsonify({
                "error": f"La cantidad de estudiantes ({cantidad_estudiantes}) supera la capacidad del aula ({capacidad_aula})."
            }), 400

        # 🚫 Aula ocupada en ese horario
        cur.execute("SELECT 1 FROM asignaciones WHERE bloque_id=%s AND aula_id=%s", (bloque_id, aula_id))
        if cur.fetchone():
            return jsonify({"error": "El aula ya está ocupada en ese horario."}), 400

        # 🚫 Docente ocupado en ese horario
        cur.execute("SELECT 1 FROM asignaciones WHERE bloque_id=%s AND docente_id=%s", (bloque_id, docente_id))
        if cur.fetchone():
            return jsonify({"error": "El docente ya tiene una clase asignada en ese horario."}), 400

        # ✅ Insertar nueva asignación
        cur.execute("""
            INSERT INTO asignaciones (
                curso_id, seccion_id, docente_id, cantidad_estudiantes,
                observaciones, bloque_id, aula_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (curso_id, seccion_id, docente_id, cantidad_estudiantes, observaciones, bloque_id, aula_id))

        conn.commit()
        return jsonify({"mensaje": "✅ Asignación registrada exitosamente."}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()
