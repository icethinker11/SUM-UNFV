from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor
from database.db import get_db

academico_bp = Blueprint('academico_bp', __name__)

# ✅ Listar todas las formaciones académicas
@academico_bp.route('/formaciones', methods=['GET'])
def obtener_formaciones():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id_formacion, nombre_formacion FROM formacion ORDER BY nombre_formacion ASC;")
        formaciones = [
            # Mapeo manual seguro
            {"id_formacion": row[0], "nombre_formacion": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"formaciones": formaciones}), 200
    except Exception as e:
        # ... (manejo de errores) ...
        pass
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ✅ Listar todas las especialidades
@academico_bp.route('/especialidades', methods=['GET'])
def obtener_especialidades():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id_especialidad, nombre_especialidad FROM especialidad ORDER BY nombre_especialidad ASC;")
        especialidades = [
            # Mapeo manual seguro
            {"id_especialidad": row[0], "nombre_especialidad": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"especialidades": especialidades}), 200
    except Exception as e:
        # ... (manejo de errores) ...
        pass
    finally:
        if cur: cur.close()
        if conn: conn.close()

# ✅ Listar todas las escuelas
@academico_bp.route('/escuelas', methods=['GET'])
def obtener_escuelas():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT escuela_id, nombre_escuela FROM escuela ORDER BY nombre_escuela ASC;")
        escuelas = [
            # Mapeo manual seguro
            {"escuela_id": row[0], "nombre_escuela": row[1]}
            for row in cur.fetchall()
        ]
        return jsonify({"escuelas": escuelas}), 200
    except Exception as e:
        # ... (manejo de errores) ...
        pass
    finally:
        if cur: cur.close()
        if conn: conn.close()