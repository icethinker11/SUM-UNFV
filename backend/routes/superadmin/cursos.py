# routes/superadmin/cursos.py
from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
from database.db import get_db

cursos_bp = Blueprint('cursos_bp', __name__)

# ======================================================
# 📚 LISTAR TODOS LOS CURSOS (Necesaria para los Dropdowns de Prerrequisitos)
# ======================================================
@cursos_bp.route('/cursos', methods=['GET'])
def obtener_cursos():
    """Obtiene la lista de todos los cursos para ser usados en selectores."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT 
                curso_id AS id_curso, 
                nombre AS nombre_curso, 
                codigo AS codigo_curso 
            FROM curso 
            ORDER BY nombre_curso ASC;
        """)

        cursos = cur.fetchall()
        return jsonify({"cursos": cursos}), 200

    except Exception as e:
        print("❌ Error al obtener cursos:", str(e))
        return jsonify({
            "error": "Error interno al obtener cursos.",
            "detalle": str(e)
        }), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# 🧩 DEFINIR PRERREQUISITOS (CORREGIDO Y SEGURO)
# ======================================================
@cursos_bp.route("/definir-prerrequisito", methods=["POST"])
def definir_prerrequisito():
    """Permite al SuperAdmin registrar un prerrequisito de un curso."""
    data = request.json
    id_curso = data.get("id_curso")
    id_curso_requerido = data.get("id_curso_requerido")

    if not id_curso or not id_curso_requerido:
        return jsonify({"error": "Debe indicar id_curso e id_curso_requerido"}), 400
    if id_curso == id_curso_requerido:
        return jsonify({"error": "Un curso no puede ser prerrequisito de sí mismo"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO prerrequisito (id_curso, id_curso_requerido)
            VALUES (%s, %s);
        """, (id_curso, id_curso_requerido))

        conn.commit()

        return jsonify({
            "mensaje": "Prerrequisito ingresado satisfactoriamente"
        }), 201

    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        error_detail = str(e)
        if 'uq_prerrequisito' in error_detail:
            error_msg = "Este prerrequisito ya se encuentra registrado para este curso."
        elif 'violates foreign key' in error_detail:
            error_msg = "Uno o ambos IDs de curso no son válidos (no existen)."
        else:
            error_msg = "Error de integridad de datos desconocido. Verifique el log."
        return jsonify({"error": error_msg}), 400

    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error interno (500) al definir prerrequisito: {e}")
        return jsonify({"error": "Error interno del servidor al guardar el prerrequisito."}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# 📋 LISTAR PRERREQUISITOS
# ======================================================
@cursos_bp.route("/prerrequisitos/<int:id_curso>", methods=["GET"])
def listar_prerrequisitos(id_curso):
    """Lista los prerrequisitos de un curso específico."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT p.id_prerrequisito, p.id_curso_requerido, c.nombre AS curso_requerido
            FROM prerrequisito p
            JOIN curso c ON p.id_curso_requerido = c.curso_id
            WHERE p.id_curso = %s
            ORDER BY c.nombre
        """, (id_curso,))

        prerrequisitos = cur.fetchall()
        return jsonify(prerrequisitos), 200

    except psycopg2.Error as e:
        print("❌ Error de DB:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# 🗑️ ELIMINAR PRERREQUISITO
# ======================================================
@cursos_bp.route("/prerrequisitos/<int:id_prerrequisito>", methods=["DELETE"])
def eliminar_prerrequisito(id_prerrequisito):
    """Permite al SuperAdmin eliminar un prerrequisito registrado."""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("DELETE FROM prerrequisito WHERE id_prerrequisito = %s", (id_prerrequisito,))
        if cur.rowcount == 0:
            return jsonify({"error": "El prerrequisito no existe"}), 404

        conn.commit()
        return jsonify({"mensaje": "Prerrequisito eliminado correctamente"}), 200

    except psycopg2.Error as e:
        print("❌ Error de DB:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()