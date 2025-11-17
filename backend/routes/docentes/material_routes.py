from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from database.db import get_db # <-- Manteniendo la consistencia con calificaciones.py
from psycopg2.extras import RealDictCursor # Necesario si usas RealDictCursor en otras partes
# Nota: Asumimos que UPLOAD_FOLDER y ALLOWED_EXTENSIONS están definidos en tu archivo config
# from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS 
import os

material_bp = Blueprint("material", __name__)

# Definiciones placeholder para que el código sea completo y ejecutable
UPLOAD_FOLDER = '/tmp/uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@material_bp.route("/subir", methods=["POST"])
def subir_material():
    # ⚠️ Nota: Esta función asume que tienes 'get_db()' correctamente configurado y un directorio /tmp/uploads
    try:
        conn = get_db()
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error de conexión a la BD: {e}")
        return jsonify({"error": "No se pudo conectar a la base de datos."}), 500
        
    try:
        # Los datos vienen de FormData
        asignacion_id = request.form.get("asignacion_id")
        docente_id = request.form.get("docente_id")
        titulo = request.form.get("titulo", "Material sin título") # Agregué un título por defecto
        descripcion = request.form.get("descripcion")
        archivo = request.files.get("archivo")

        # Conversión a entero (importante para la BD)
        try:
            asignacion_id = int(asignacion_id)
            docente_id = int(docente_id)
        except (ValueError, TypeError):
            return jsonify({"error": "ID de asignación o docente inválido."}), 400

        if not archivo:
            return jsonify({"error": "No se envió archivo"}), 400

        if not allowed_file(archivo.filename):
            return jsonify({"error": "Tipo de archivo no permitido"}), 400

        filename = secure_filename(archivo.filename)
        
        # Asegurar que la carpeta de subida exista
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        ruta_final = os.path.join(UPLOAD_FOLDER, filename)

        archivo.save(ruta_final)
        
        # ✅ VERIFICADO: Esta sintaxis es correcta para Psycopg2
        cur.execute("""
            INSERT INTO materiales (asignacion_id, docente_id, titulo, descripcion, nombre_archivo, ruta_archivo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            asignacion_id, docente_id, titulo, descripcion, filename, ruta_final
        ))

        conn.commit()

        return jsonify({"msg": "Material subido correctamente", "nombre_archivo": filename}), 200

    except Exception as e:
        conn.rollback()
        print(f"❌ Error al subir material: {e}")
        return jsonify({"error": "Error interno del servidor al procesar la subida."}), 500
    finally:
        cur.close()
        conn.close()


@material_bp.route("/listar/<int:asignacion_id>")
def listar_material(asignacion_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor) # Usamos RealDictCursor para obtener diccionarios
    try:
        cur.execute("""
            SELECT id, asignacion_id, docente_id, titulo, descripcion, nombre_archivo, fecha_subida
            FROM materiales
            WHERE asignacion_id = %s
            ORDER BY fecha_subida DESC
        """, (asignacion_id,))
        
        rows = cur.fetchall()

        return jsonify(rows)
    
    except Exception as e:
        print(f"❌ Error al listar material: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@material_bp.route("/descargar/<archivo>")
def descargar_material(archivo):
    # La ruta de descarga debe manejar los archivos guardados en UPLOAD_FOLDER
    # Se usa send_from_directory para servir archivos de manera segura.
    return send_from_directory(UPLOAD_FOLDER, archivo, as_attachment=True)

# ================================================
# 📚 Obtener cursos asignados al docente (EL CÓDIGO CLAVE)
# ================================================
@material_bp.route("/cursos/<int:docente_id>", methods=["GET"])
def obtener_cursos_docente(docente_id):
    # 🚨 NOTA: Se asume que 'docente_id' es un entero (int)
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
    except Exception as e:
        print(f"❌ Error de conexión a la BD: {e}")
        return jsonify({"error": "No se pudo conectar a la base de datos."}), 500
        
    try:
        # ✅ VERIFICADO: Esta consulta es correcta para obtener las asignaciones de un docente
        cur.execute("""
            SELECT DISTINCT
                a.asignacion_id,
                c.curso_id,
                c.nombre AS curso,
                s.codigo AS seccion,
                c.ciclo
            FROM asignaciones a
            JOIN curso c ON a.curso_id = c.curso_id
            JOIN secciones s ON a.seccion_id = s.seccion_id
            WHERE a.docente_id = %s
            ORDER BY c.ciclo, c.nombre
        """, (docente_id,))
        cursos = cur.fetchall()
        
        # 🔔 Agregado para depuración: Si retorna un array vacío [], el frontend lo sabrá.
        if not cursos:
            print(f"⚠️ No se encontraron asignaciones para el docente ID: {docente_id}")
            
        return jsonify(cursos)
    except Exception as e:
        print("❌ Error al obtener cursos del docente:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()