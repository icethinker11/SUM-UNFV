from flask import Blueprint, jsonify
from psycopg2.extras import RealDictCursor
from database.db import get_db

ubicaciones_bp = Blueprint('ubicaciones_bp', __name__)

# ✅ Listar todos los departamentos
@ubicaciones_bp.route('/departamentos-geo', methods=['GET'])
def obtener_departamentos_geo():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT departamento_id, nombre_departamento FROM departamento_geo ORDER BY nombre_departamento ASC;")
        departamentos = [
            {"departamento_id": row[0], "nombre_departamento": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"departamentos": departamentos}), 200
    except Exception as e:
        print(f"❌ ERROR al obtener departamentos geo: {e}")
        return jsonify({"error": "Error interno. No se pudieron obtener los departamentos geográficos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ✅ Listar provincias de un departamento
@ubicaciones_bp.route('/provincias/<int:departamento_id>', methods=['GET'])
def obtener_provincias(departamento_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT provincia_id, nombre_provincia 
            FROM provincia 
            WHERE departamento_id = %s 
            ORDER BY nombre_provincia ASC;
        """, (departamento_id,))
        provincias = [
            {"provincia_id": row[0], "nombre_provincia": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"provincias": provincias}), 200
    except Exception as e:
        print(f"❌ ERROR al obtener provincias: {e}")
        return jsonify({"error": "Error interno al consultar provincias."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ✅ Listar todos los distritos
@ubicaciones_bp.route('/distritos', methods=['GET'])
def listar_distritos():
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT distrito_id, nombre_distrito FROM distrito ORDER BY nombre_distrito ASC")
        distritos = cur.fetchall()
        return jsonify({"distritos": distritos})
    except Exception as e:
        print("Error al listar distritos:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ✅ Listar distritos de una provincia específica
@ubicaciones_bp.route('/distritos/<int:provincia_id>', methods=['GET'])
def obtener_distritos_por_provincia(provincia_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor() 
        cur.execute("""
            SELECT distrito_id, nombre_distrito 
            FROM distrito 
            WHERE provincia_id = %s 
            ORDER BY nombre_distrito ASC;
        """, (provincia_id,))
        distritos = [
            {"distrito_id": row[0], "nombre_distrito": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"distritos": distritos}), 200
    except Exception as e:
        print(f"❌ ERROR al obtener distritos: {e}")
        return jsonify({"error": "Error interno al obtener distritos."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()