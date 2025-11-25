from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
import psycopg2
from database.db import get_db  

# Definimos el Blueprint
secciones_bp = Blueprint('secciones', __name__)

# --- RUTAS LIMPIAS ---
# El prefijo '/superadmin/secciones' se define en app.py
# Así que '/' aquí se convierte en '/superadmin/secciones'
# Y '/<int:id>' se convierte en '/superadmin/secciones/<id>'

@secciones_bp.route('/secciones', methods=['GET'])
def get_secciones():
    """
    Ruta para OBTENER todas las secciones.
    """
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Usamos el nombre de tabla correcto 'secciones'
        cur.execute("SELECT seccion_id, codigo, ciclo_academico, periodo, estado FROM secciones ORDER BY periodo DESC, ciclo_academico, codigo;")
        
        secciones = cur.fetchall()
        return jsonify(secciones), 200
        
    except Exception as e:
        print(f"❌ Error al obtener secciones: {str(e)}")
        return jsonify({"error": "Error interno al obtener secciones."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@secciones_bp.route('/secciones', methods=['POST'])
def create_seccion():
    """
    Ruta para CREAR una nueva sección.
    """
    data = request.get_json()
    codigo = data.get('codigo')
    ciclo_academico = data.get('ciclo_academico')
    periodo = data.get('periodo')
    estado = data.get('estado', 'ACTIVO')

    if not codigo or not ciclo_academico or not periodo:
        return jsonify({"error": "Datos incompletos: código, ciclo y periodo son requeridos."}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verificar duplicado antes de insertar
        cur.execute("""
            SELECT 1 FROM secciones 
            WHERE codigo = %s AND ciclo_academico = %s AND periodo = %s
        """, (codigo, ciclo_academico, periodo))

        if cur.fetchone():
            return jsonify({
                "error": "⛔ La sección ya existe (código, ciclo y periodo)."
            }), 400

        cur.execute(
            """
            INSERT INTO secciones (codigo, ciclo_academico, periodo, estado) 
            VALUES (%s, %s, %s, %s)
            RETURNING seccion_id, codigo, ciclo_academico, periodo, estado;
            """,
            (codigo, ciclo_academico, periodo, estado)
        )
        nueva_seccion = cur.fetchone()
        conn.commit()
        
        return jsonify(nueva_seccion), 201

    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        error_detail = str(e).lower()
        print(f"🔥 Error de integridad al crear secciones: {error_detail}")
        
        if "unique constraint" in error_detail:
             msg = "La sección (código, ciclo y periodo) ya existe."
        else:
             msg = "Error de integridad de datos."
        
        return jsonify({"error": msg}), 409 

    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error inesperado al crear secciones: {e}")
        return jsonify({"error": "Error interno del servidor al crear la sección."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@secciones_bp.route('/secciones/<int:id>', methods=['PUT'])
def update_seccion(id):
    """
    Ruta para ACTUALIZAR una sección existente.
    """
    data = request.get_json()
    codigo = data.get('codigo')
    ciclo_academico = data.get('ciclo_academico')
    periodo = data.get('periodo')
    estado = data.get('estado')

    if not codigo or not ciclo_academico or not periodo or not estado:
        return jsonify({"error": "Datos incompletos"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            """
            UPDATE secciones 
            SET codigo = %s, ciclo_academico = %s, periodo = %s, estado = %s
            WHERE seccion_id = %s
            RETURNING seccion_id, codigo, ciclo_academico, periodo, estado;
            """,
            (codigo, ciclo_academico, periodo, estado, id)
        )
        
        if cur.rowcount == 0:
            return jsonify({"error": "Sección no encontrada"}), 404
            
        seccion_actualizada = cur.fetchone()
        conn.commit()
        return jsonify(seccion_actualizada), 200

    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        return jsonify({"error": "Error de integridad, posible duplicado."}), 409
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error inesperado al actualizar secciones: {e}")
        return jsonify({"error": "Error interno del servidor al actualizar."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@secciones_bp.route('/secciones/<int:id>', methods=['DELETE'])
def delete_seccion(id):
    """
    Ruta para ELIMINAR una sección.
    """
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor() 
        
        cur.execute("DELETE FROM secciones WHERE seccion_id = %s", (id,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Sección no encontrada"}), 404
            
        conn.commit()
        return jsonify({"mensaje": "Sección eliminada exitosamente"}), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error al eliminar secciones: {e}")
        return jsonify({"error": "Error al eliminar la sección."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()