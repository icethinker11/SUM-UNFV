# routes/curso_routes.py
from flask import Blueprint, request, jsonify
from database.db import get_db
from psycopg2.extras import RealDictCursor

curso_bp = Blueprint("curso", __name__)

# ===========================
# CREAR CURSO
# ===========================
@curso_bp.route("/crear", methods=["POST"])
def crear_curso():
    data = request.json
    codigo = data.get("codigo")
    nombre = data.get("nombre")
    creditos = data.get("creditos")
    ciclo = data.get("ciclo")
    horas_teoricas = data.get("horasTeoricas")
    horas_practicas = data.get("horasPracticas")
    tipo = data.get("tipo")
    usuario_creacion = data.get("usuario_creacion")

    try:
        conn = get_db()
        cur = conn.cursor()

        # 🔎 validar que el código sea único
        cur.execute("SELECT 1 FROM curso WHERE codigo = %s", (codigo,))
        if cur.fetchone():
            return jsonify({"error": "El código del curso ya existe ❌"}), 400

        # insertar
        cur.execute("""
            INSERT INTO curso (codigo, nombre, creditos, ciclo, horas_teoricas, horas_practicas, tipo, usuario_creacion)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING curso_id, nombre, codigo
        """, (codigo, nombre, creditos, ciclo, horas_teoricas, horas_practicas, tipo, usuario_creacion))

        nuevo = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"mensaje": "Curso creado con éxito ✅", "curso": nuevo}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================
# OBTENER CURSO POR ID
# ===========================
@curso_bp.route("/<int:curso_id>", methods=["GET"])
def obtener_curso(curso_id):
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                curso_id, 
                codigo, 
                nombre, 
                creditos, 
                ciclo, 
                horas_teoricas, 
                horas_practicas, 
                tipo, 
                estado
            FROM curso 
            WHERE curso_id = %s
        """, (curso_id,))
        
        curso = cur.fetchone()
        cur.close()
        conn.close()
        
        if not curso:
            return jsonify({"error": "Curso no encontrado ❌"}), 404
            
        return jsonify(curso), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================
# ACTUALIZAR CURSO (VERSIÓN SIMPLE - SIN CAMPOS DE AUDITORÍA)
# ===========================
@curso_bp.route("/actualizar/<int:curso_id>", methods=["PUT"])
def actualizar_curso(curso_id):
    data = request.json
    codigo = data.get("codigo")
    nombre = data.get("nombre")
    creditos = data.get("creditos")
    ciclo = data.get("ciclo")
    horas_teoricas = data.get("horas_teoricas")
    horas_practicas = data.get("horas_practicas")
    tipo = data.get("tipo")

    try:
        conn = get_db()
        cur = conn.cursor()

        # Verificar que el curso existe
        cur.execute("SELECT curso_id FROM curso WHERE curso_id = %s", (curso_id,))
        if not cur.fetchone():
            return jsonify({"error": "Curso no encontrado ❌"}), 404

        # Validar que el código no esté duplicado
        cur.execute("SELECT 1 FROM curso WHERE codigo = %s AND curso_id != %s", (codigo, curso_id))
        if cur.fetchone():
            return jsonify({"error": "El código del curso ya está en uso por otro curso ❌"}), 400

        # Actualizar el curso - SOLO CAMPOS BÁSICOS
        cur.execute("""
            UPDATE curso 
            SET 
                codigo = %s,
                nombre = %s,
                creditos = %s,
                ciclo = %s,
                horas_teoricas = %s,
                horas_practicas = %s,
                tipo = %s
            WHERE curso_id = %s
            RETURNING curso_id, codigo, nombre
        """, (codigo, nombre, creditos, ciclo, horas_teoricas, horas_practicas, tipo, curso_id))

        curso_actualizado = cur.fetchone()
        conn.commit()
        
        return jsonify({
            "mensaje": "Curso actualizado correctamente ✅",
            "curso_actualizado": {
                "curso_id": curso_actualizado[0],
                "codigo": curso_actualizado[1],
                "nombre": curso_actualizado[2]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ===========================
# ELIMINAR CURSO
# ===========================
@curso_bp.route("/eliminar/<int:curso_id>", methods=["DELETE"])
def eliminar_curso(curso_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        # Eliminar curso
        cur.execute("DELETE FROM curso WHERE curso_id = %s", (curso_id,))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"mensaje": "Curso eliminado correctamente."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================
# LISTAR CURSOS
# ===========================
@curso_bp.route("/", methods=["GET"])
def listar_cursos():
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT c.curso_id, c.codigo, c.nombre, c.creditos, c.ciclo, 
                   c.horas_teoricas, c.horas_practicas, c.tipo, c.estado, c.fecha_creacion
            FROM curso c
            ORDER BY c.curso_id DESC
        """)
        cursos = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(cursos)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================
# CONSULTAR CURSOS 
# ===========================
@curso_bp.route("/listar", methods=["GET"])
def consultar_cursos():
    try:
        ciclo = request.args.get("ciclo")  # Ejemplo: /curso/listar?ciclo=III
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if ciclo:
            cur.execute("""
                SELECT c.curso_id, c.codigo, c.nombre, c.creditos, c.ciclo,
                       c.horas_teoricas, c.horas_practicas, c.tipo, c.estado, c.fecha_creacion
                FROM curso c
                WHERE c.ciclo = %s
                ORDER BY c.curso_id DESC
            """, (ciclo,))
        else:
            cur.execute("""
                SELECT c.curso_id, c.codigo, c.nombre, c.creditos, c.ciclo,
                       c.horas_teoricas, c.horas_practicas, c.tipo, c.estado, c.fecha_creacion
                FROM curso c
                ORDER BY c.curso_id DESC
            """)

        cursos = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(cursos), 200

    except Exception as e:
        print("Error en consultar_cursos:", e)
        return jsonify({"error": str(e)}), 500
    
    