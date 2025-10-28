from flask import Blueprint, jsonify
from database.db import get_db
from psycopg2.extras import RealDictCursor

escuelas_bp = Blueprint('escuelas', __name__)

# ===========================
# LISTAR ESCUELAS
# ===========================
@escuelas_bp.route("/escuelas", methods=["GET"])
def obtener_escuelas():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT escuela_id, nombre_escuela, facultad 
            FROM escuela 
            ORDER BY nombre_escuela ASC
        """)
        escuelas = cur.fetchall()
        
        return jsonify({"escuelas": escuelas}), 200
        
    except Exception as e:
        print(f"❌ Error al obtener escuelas: {e}")
        return jsonify({"error": "Error interno al obtener escuelas"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()