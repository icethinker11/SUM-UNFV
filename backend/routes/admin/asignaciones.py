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

    # Datos base
    curso_id = data.get("curso_id")
    seccion_id = data.get("seccion_id")
    docente_id = data.get("docente_id")
    cantidad_estudiantes = data.get("estudiantes")
    observaciones = data.get("observaciones", "")

    # Bloque principal
    bloque_id = data.get("horario_id")
    aula_id = data.get("aula_id")

    # Del Bloque opcional
    bloque_id_2 = data.get("horario_id_2")
    aula_id_2 = data.get("aula_id_2")

    # ✅ Validar campos obligatorios
    if not all([curso_id, seccion_id, docente_id, cantidad_estudiantes, bloque_id, aula_id]):
        return jsonify({"error": "⚠️ Faltan campos obligatorios"}), 400

    # ✅ Validar estudiantes
    try:
        cantidad_estudiantes = int(cantidad_estudiantes)
        if cantidad_estudiantes <= 0:
            return jsonify({"error": "⚠️ La cantidad de estudiantes debe ser mayor a 0."}), 400
    except:
        return jsonify({"error": "⚠️ Cantidad de estudiantes inválida."}), 400

    # ✅ No permitir bloque 2 igual al bloque 1
    if bloque_id_2 and bloque_id_2 == bloque_id:
        return jsonify({"error": "⚠️ El segundo bloque de horario no puede ser igual al primero."}), 400

    conn = get_db()
    cur = conn.cursor()

    try:
        # ✅ Validar sección activa
        cur.execute("""
            SELECT 1 FROM secciones 
            WHERE seccion_id=%s AND UPPER(estado)='ACTIVO'
        """, (seccion_id,))
        if not cur.fetchone():
            return jsonify({"error": "La sección no está activa."}), 400

        # ✅ Validar bloque 1 activo
        cur.execute("""
            SELECT dia FROM bloque_horario 
            WHERE bloque_id=%s AND UPPER(estado)='ACTIVO'
        """, (bloque_id,))
        bloque1 = cur.fetchone()
        if not bloque1:
            return jsonify({"error": "Bloque horario principal no válido."}), 400

        dia_bloque_1 = bloque1[0]

        # ✅ Validar bloque 2 activo (si existe)
        dia_bloque_2 = None
        if bloque_id_2:
            cur.execute("""
                SELECT dia FROM bloque_horario 
                WHERE bloque_id=%s AND UPPER(estado)='ACTIVO'
            """, (bloque_id_2,))
            bloque2 = cur.fetchone()
            if not bloque2:
                return jsonify({"error": "Bloque horario secundario no válido."}), 400
            dia_bloque_2 = bloque2[0]

        # ✅ Validar aulas
        def validar_aula(aula_id_validar, bloque_validar):
            cur.execute("""
                SELECT capacidad FROM aula 
                WHERE aula_id=%s AND UPPER(estado)='OPERATIVO'
            """, (aula_id_validar,))
            aula = cur.fetchone()
            if not aula:
                return "Aula no operativa o inexistente"
            if cantidad_estudiantes > aula[0]:
                return "Capacidad insuficiente"
            return None

        error = validar_aula(aula_id, bloque_id)
        if error:
            return jsonify({"error": f"Aula principal: {error}"}), 400

        if bloque_id_2 and aula_id_2:
            error = validar_aula(aula_id_2, bloque_id_2)
            if error:
                return jsonify({"error": f"Aula secundaria: {error}"}), 400

        # ✅ Validar aula ocupada BLOQUE 1
        cur.execute("""
            SELECT 1 FROM asignaciones 
            WHERE bloque_id=%s AND aula_id=%s
        """, (bloque_id, aula_id))
        if cur.fetchone():
            return jsonify({"error": "El aula ya está ocupada en el bloque principal."}), 400

        # ✅ Validar docente BLOQUE 1
        cur.execute("""
            SELECT 1 FROM asignaciones 
            WHERE bloque_id=%s AND docente_id=%s
        """, (bloque_id, docente_id))
        if cur.fetchone():
            return jsonify({"error": "El docente ya tiene una clase en el bloque principal."}), 400

        # ✅ Validar duplicado en la misma sección
        cur.execute("""
            SELECT 1 FROM asignaciones
            WHERE curso_id=%s 
            AND seccion_id=%s 
            AND bloque_id=%s
        """, (curso_id, seccion_id, bloque_id))
        if cur.fetchone():
            return jsonify({
                "error": "Este curso ya tiene una asignación registrada en esta sección y bloque."
            }), 400

        # ================================
        # ✅ VALIDACIONES BLOQUE 2
        # ================================
        if bloque_id_2:

            # Aula ocupada BLOQUE 2
            cur.execute("""
                SELECT 1 FROM asignaciones 
                WHERE bloque_id=%s AND aula_id=%s
            """, (bloque_id_2, aula_id_2))
            if cur.fetchone():
                return jsonify({"error": "El aula ya está ocupada en el segundo bloque."}), 400

            # Docente ocupado BLOQUE 2
            cur.execute("""
                SELECT 1 FROM asignaciones 
                WHERE bloque_id=%s AND docente_id=%s
            """, (bloque_id_2, docente_id))
            if cur.fetchone():
                return jsonify({"error": "El docente ya tiene clase en el segundo bloque."}), 400

            # Validar duplicado dentro de sección (bloque 2)
            cur.execute("""
                SELECT 1 FROM asignaciones
                WHERE curso_id=%s 
                AND seccion_id=%s 
                AND bloque_id=%s
            """, (curso_id, seccion_id, bloque_id_2))
            if cur.fetchone():
                return jsonify({
                    "error": "Estas duplicando el registro del curso en sección con el segundo bloque."
                }), 400

        # ================================
        # ✅ INSERTAR BLOQUE 1
        # ================================
        cur.execute("""
            INSERT INTO asignaciones (
                curso_id, seccion_id, docente_id, cantidad_estudiantes,
                observaciones, bloque_id, aula_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            curso_id, seccion_id, docente_id, cantidad_estudiantes,
            observaciones, bloque_id, aula_id
        ))

        # ================================
        # ✅ INSERTAR BLOQUE 2 (OPCIONAL)
        # ================================
        if bloque_id_2 and aula_id_2:
            cur.execute("""
                INSERT INTO asignaciones (
                    curso_id, seccion_id, docente_id, cantidad_estudiantes,
                    observaciones, bloque_id, aula_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                curso_id, seccion_id, docente_id, cantidad_estudiantes,
                observaciones, bloque_id_2, aula_id_2
            ))

        conn.commit()
        return jsonify({"mensaje": "✅ Asignación registrada exitosamente."}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()

# -----------------------------
# LISTAR ASIGNACIONES
# -----------------------------
@asignaciones_bp.route("/listar-asignaciones", methods=["GET"])
def listar_asignaciones():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                a.asignacion_id,
                a.curso_id,
                a.seccion_id,
                a.docente_id,
                a.cantidad_estudiantes,
                a.observaciones,
                a.bloque_id,
                a.aula_id
            FROM asignaciones a
            ORDER BY a.asignacion_id DESC
        """)
        asignaciones = cur.fetchall()
        return jsonify(asignaciones)
    except Exception as e:
        return jsonify({"error": f"Error al listar asignaciones: {str(e)}"}), 500
    finally:
        cur.close()
        conn.close()


# -----------------------------
# EDITAR ASIGNACIÓN
# -----------------------------
@asignaciones_bp.route("/editar-asignacion/<int:asignacion_id>", methods=["PUT"])
def editar_asignacion(asignacion_id):
    data = request.get_json() or {}

    curso_id = data.get("curso_id")
    seccion_id = data.get("seccion_id")
    docente_id = data.get("docente_id")
    cantidad_estudiantes = data.get("estudiantes")
    observaciones = data.get("observaciones", "")
    bloque_id = data.get("horario_id")
    aula_id = data.get("aula_id")

    if not all([curso_id, seccion_id, docente_id, cantidad_estudiantes, bloque_id, aula_id]):
        return jsonify({"error": "⚠️ Faltan campos obligatorios"}), 400

    try:
        cantidad_estudiantes = int(cantidad_estudiantes)
        if cantidad_estudiantes <= 0:
            return jsonify({"error": "⚠️ La cantidad de estudiantes debe ser mayor que 0."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "⚠️ La cantidad de estudiantes debe ser un número válido."}), 400

    conn = get_db()
    cur = conn.cursor()

    try:
        # Validar que la asignación existe
        cur.execute("SELECT 1 FROM asignaciones WHERE asignacion_id=%s", (asignacion_id,))
        if not cur.fetchone():
            return jsonify({"error": "La asignación no existe."}), 404

        # Validar capacidad del aula
        cur.execute("SELECT capacidad FROM aula WHERE aula_id=%s AND UPPER(estado)='OPERATIVO'", (aula_id,))
        aula = cur.fetchone()
        if not aula:
            return jsonify({"error": "El aula seleccionada no está operativa o no existe."}), 400

        capacidad_aula = aula[0]
        if cantidad_estudiantes > capacidad_aula:
            return jsonify({
                "error": f"La cantidad de estudiantes ({cantidad_estudiantes}) supera la capacidad del aula ({capacidad_aula})."
            }), 400

        # Validar conflicto de aula (excepto la asignación actual)
        cur.execute("""
            SELECT 1 FROM asignaciones 
            WHERE bloque_id=%s AND aula_id=%s AND asignacion_id != %s
        """, (bloque_id, aula_id, asignacion_id))
        if cur.fetchone():
            return jsonify({"error": "El aula ya está ocupada en ese horario."}), 400

        # Validar conflicto de docente (excepto la asignación actual)
        cur.execute("""
            SELECT 1 FROM asignaciones 
            WHERE bloque_id=%s AND docente_id=%s AND asignacion_id != %s
        """, (bloque_id, docente_id, asignacion_id))
        if cur.fetchone():
            return jsonify({"error": "El docente ya tiene una clase asignada en ese horario."}), 400

        # Actualizar asignación
        cur.execute("""
            UPDATE asignaciones
            SET curso_id = %s,
                seccion_id = %s,
                docente_id = %s,
                cantidad_estudiantes = %s,
                observaciones = %s,
                bloque_id = %s,
                aula_id = %s
            WHERE asignacion_id = %s
        """, (curso_id, seccion_id, docente_id, cantidad_estudiantes, observaciones, bloque_id, aula_id, asignacion_id))

        conn.commit()
        return jsonify({"mensaje": "✅ Asignación actualizada exitosamente."}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()


# -----------------------------
# ELIMINAR ASIGNACIÓN
# -----------------------------
@asignaciones_bp.route("/eliminar-asignacion/<int:asignacion_id>", methods=["DELETE"])
def eliminar_asignacion(asignacion_id):
    conn = get_db()
    cur = conn.cursor()

    try:
        # Verificar que la asignación existe
        cur.execute("SELECT 1 FROM asignaciones WHERE asignacion_id=%s", (asignacion_id,))
        if not cur.fetchone():
            return jsonify({"error": "La asignación no existe."}), 404

        # Eliminar asignación
        cur.execute("DELETE FROM asignaciones WHERE asignacion_id=%s", (asignacion_id,))
        conn.commit()

        return jsonify({"mensaje": "✅ Asignación eliminada exitosamente."}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()