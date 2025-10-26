from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
import psycopg2
from database.db import get_db

prerrequisitos_bp = Blueprint('prerrequisitos', __name__)

# ======================================================
# 📚 RUTAS DE CURSOS Y PRERREQUISITOS
# ======================================================

@prerrequisitos_bp.route('/cursos', methods=['GET'])
def obtener_cursos():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor) 
        cur.execute("SELECT curso_id AS id_curso, nombre AS nombre_curso, codigo AS codigo_curso FROM curso ORDER BY nombre ASC;")
        return jsonify({"cursos": cur.fetchall()}), 200
    except Exception as e:
        print(f"❌ Error al obtener cursos: {str(e)}")
        return jsonify({"error": "Error interno al obtener cursos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@prerrequisitos_bp.route('/cursos-con-prerrequisitos', methods=['GET'])
def obtener_cursos_con_prerrequisitos():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT 
                c1.curso_id, c1.codigo AS codigo_curso, c1.nombre AS nombre_curso,
                p.id_prerrequisito, c2.codigo AS codigo_requerido,
                c2.curso_id AS id_curso_requerido, c2.nombre AS nombre_requerido
            FROM prerrequisito p
            JOIN curso c1 ON p.id_curso = c1.curso_id
            JOIN curso c2 ON p.id_curso_requerido = c2.curso_id
            ORDER BY c1.nombre, c2.codigo;
        """)
        results = cur.fetchall()
        cursos_agrupados = {}
        for row in results:
            if row['curso_id'] not in cursos_agrupados:
                cursos_agrupados[row['curso_id']] = {
                    "curso_id": row['curso_id'], "codigo_curso": row['codigo_curso'],
                    "nombre_curso": row['nombre_curso'], "prerrequisitos": []
                }
            cursos_agrupados[row['curso_id']]['prerrequisitos'].append({
                "prerrequisito_id": row['id_prerrequisito'], "codigo_requerido": row['codigo_requerido'],
                "id_curso_requerido": row['id_curso_requerido'], "nombre_requerido": row['nombre_requerido']
            })
        return jsonify({"cursos": list(cursos_agrupados.values())}), 200
    except Exception as e:
        print(f"❌ Error al obtener cursos con prerrequisitos: {e}")
        return jsonify({"error": "Error interno al consultar los cursos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@prerrequisitos_bp.route("/definir-prerrequisito", methods=["POST"])
def definir_prerrequisito():
    data = request.json
    id_curso = data.get("id_curso")
    id_curso_requerido = data.get("id_curso_requerido")

    if not id_curso or not id_curso_requerido or id_curso == id_curso_requerido:
        return jsonify({"error": "Datos de prerrequisito inválidos."}), 400
    
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        print(f"✅ Intentando insertar: id_curso={id_curso}, id_curso_requerido={id_curso_requerido}")
        cur.execute(
            "INSERT INTO prerrequisito (id_curso, id_curso_requerido) VALUES (%s, %s);",
            (id_curso, id_curso_requerido)
        )
        conn.commit()
        print("✅ Inserción de prerrequisito exitosa.")
        return jsonify({"mensaje": "Prerrequisito guardado correctamente."}), 201
    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        error_detail = str(e).lower()
        print(f"🔥 Error de integridad al guardar prerrequisito: {error_detail}")

        if "prerrequisito_pkey" in error_detail or "violates not-null constraint" in error_detail:
             msg = "Error de BD: La columna 'id_prerrequisito' podría no ser autoincremental (SERIAL)."
        elif "duplicate key value violates unique constraint" in error_detail:
             msg = "Este prerrequisito ya se encuentra registrado para este curso."
        elif "violates foreign key constraint" in error_detail:
             msg = "Uno o ambos IDs de curso no son válidos (no existen)."
        else:
             msg = f"Error de integridad de datos. {str(e)}"
        
        return jsonify({"error": msg}), 400
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error inesperado al definir prerrequisito: {e}")
        return jsonify({"error": "Error interno del servidor al guardar el prerrequisito."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@prerrequisitos_bp.route("/prerrequisitos/<int:id_prerrequisito>", methods=["DELETE"])
def eliminar_prerrequisito(id_prerrequisito):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM prerrequisito WHERE id_prerrequisito = %s", (id_prerrequisito,))
        if cur.rowcount == 0:
            return jsonify({"error": "El prerrequisito no fue encontrado."}), 404
        conn.commit()
        return jsonify({"mensaje": "Prerrequisito eliminado correctamente."}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "Error interno al eliminar el prerrequisito."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@prerrequisitos_bp.route('/prerrequisitos/curso/<int:id_curso>', methods=['DELETE'])
def eliminar_prerrequisitos_por_curso(id_curso):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM prerrequisito WHERE id_curso = %s", (id_curso,))
        conn.commit()
        return jsonify({"mensaje": "Prerrequisitos eliminados."}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "Error interno al limpiar prerrequisitos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()