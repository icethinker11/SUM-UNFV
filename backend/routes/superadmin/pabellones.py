from flask import Blueprint, jsonify
from psycopg2.extras import RealDictCursor
from database.db import get_db

pabellones_bp = Blueprint('pabellones', __name__)

# ======================================================
# 🏛️ LISTAR PABELLONES
# ======================================================

@pabellones_bp.route('/pabellones', methods=['GET'])
def obtener_pabellones():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT pabellon_id, nombre_pabellon FROM pabellon ORDER BY nombre_pabellon ASC;")
        pabellones = cur.fetchall()
        return jsonify(pabellones), 200
    except Exception as e:
        print(f"❌ Error al obtener pabellones: {e}")
        return jsonify({"error": "Error interno al obtener pabellones."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# 🏷️ LISTAR TIPOS DE AULA
# ======================================================

@pabellones_bp.route('/tipos-aula', methods=['GET'])
def obtener_tipos_aula():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT tipo_aula_id, nombre_tipo FROM tipo_aula_cat ORDER BY nombre_tipo ASC;")
        tipos_aula = cur.fetchall()
        return jsonify(tipos_aula), 200
    except Exception as e:
        print(f"❌ Error al obtener tipos de aula: {e}")
        return jsonify({"error": "Error interno al obtener tipos de aula."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()