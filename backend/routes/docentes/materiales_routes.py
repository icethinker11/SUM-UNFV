from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
from database.db import get_db
from . import docentes_bp
import os
import traceback

# ===========================
# 🔹 Registrar Auditoría
# ===========================
def registrar_auditoria(docente_id, accion, tabla_afectada, registro_id=None, detalles=None):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO auditoria_docente (docente_id, accion, tabla_afectada, registro_id, detalles, ip_address, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            docente_id,
            accion,
            tabla_afectada,
            registro_id,
            str(detalles),
            request.remote_addr,
            datetime.utcnow()
        ))
        conn.commit()
        cur.close()
    except Exception:
        print("⚠️ Error al registrar auditoría")
        print(traceback.format_exc())

# ===========================
# 🔹 Subir material didáctico
# ===========================
@docentes_bp.route('/materiales', methods=['POST'])
@jwt_required()
def subir_material():
    try:
        usuario_id = get_jwt_identity()
        archivo = request.files.get("archivo")

        if not archivo:
            return jsonify({"error": "Debe adjuntar un archivo"}), 400

        curso_id = request.form.get("curso_id")
        titulo = request.form.get("titulo")
        descripcion = request.form.get("descripcion")
        unidad = request.form.get("unidad")

        if not curso_id or not titulo or not descripcion or not unidad:
            return jsonify({"error": "Datos del formulario incompletos"}), 400

        # Validar extensión
        extensiones_permitidas = {"pdf", "docx", "pptx", "zip", "jpg", "png", "mp4"}
        extension = archivo.filename.rsplit(".", 1)[-1].lower()
        if extension not in extensiones_permitidas:
            return jsonify({"error": f"Extensión .{extension} no permitida"}), 400

        # Guardar archivo físico
        filename = secure_filename(archivo.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nuevo_nombre = f"{timestamp}_{filename}"
        upload_folder = os.path.join("uploads", "materiales", str(curso_id))
        os.makedirs(upload_folder, exist_ok=True)
        ruta_archivo = os.path.join(upload_folder, nuevo_nombre)
        archivo.save(ruta_archivo)

        archivo_tamano = os.path.getsize(ruta_archivo)
        conn = get_db()
        cur = conn.cursor()

        # Guardar en base de datos
        cur.execute("""
            INSERT INTO materiales_didacticos (
                titulo, descripcion, curso_id, unidad, docente_id,
                archivo_nombre, archivo_ruta, archivo_tipo, archivo_tamano, fecha_subida
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING material_id
        """, (
            titulo, descripcion, curso_id, unidad, usuario_id,
            nuevo_nombre, ruta_archivo, extension, archivo_tamano, datetime.utcnow()
        ))
        material_id = cur.fetchone()[0]
        conn.commit()

        registrar_auditoria(
            docente_id=usuario_id,
            accion="subir_material",
            tabla_afectada="materiales_didacticos",
            registro_id=material_id,
            detalles={
                "titulo": titulo,
                "curso_id": curso_id,
                "unidad": unidad,
                "archivo_nombre": nuevo_nombre,
                "archivo_tamano": archivo_tamano
            }
        )

        cur.close()
        return jsonify({
            "mensaje": "Material subido correctamente",
            "material": {
                "material_id": material_id,
                "titulo": titulo,
                "fecha_subida": datetime.utcnow().isoformat()
            }
        }), 201

    except Exception as e:
        if "ruta_archivo" in locals() and os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)
        print("❌ Error al subir material:")
        print(traceback.format_exc())
        return jsonify({"error": "Error interno al subir el material"}), 500

# ===========================
# 🔹 Obtener materiales del curso
# ===========================
@docentes_bp.route('/materiales/curso/<int:curso_id>', methods=['GET'])
@jwt_required()
def obtener_materiales_curso(curso_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT material_id, titulo, descripcion, unidad, archivo_nombre, 
                   archivo_tipo, archivo_tamano, fecha_subida
            FROM materiales_didacticos
            WHERE curso_id = %s
            ORDER BY fecha_subida DESC
        """, (curso_id,))
        materiales = cur.fetchall()

        resultado = [{
            "material_id": m[0],
            "titulo": m[1],
            "descripcion": m[2],
            "unidad": m[3],
            "archivo_nombre": m[4],
            "archivo_tipo": m[5],
            "archivo_tamano": m[6],
            "fecha_subida": m[7].isoformat()
        } for m in materiales]

        cur.close()
        return jsonify(resultado), 200

    except Exception:
        print("❌ Error en obtener_materiales_curso():")
        print(traceback.format_exc())
        return jsonify({"error": "Error al obtener materiales"}), 500

# ===========================
# 🔹 Eliminar material
# ===========================
@docentes_bp.route('/materiales/<int:material_id>', methods=['DELETE'])
@jwt_required()
def eliminar_material(material_id):
    try:
        usuario_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            SELECT docente_id, archivo_ruta, titulo FROM materiales_didacticos
            WHERE material_id = %s
        """, (material_id,))
        fila = cur.fetchone()
        if not fila:
            return jsonify({"error": "Material no encontrado"}), 404

        docente_id, archivo_ruta, titulo = fila

        if usuario_id != docente_id:
            return jsonify({"error": "No tienes permisos para eliminar este material"}), 403

        # Eliminar archivo físico
        if os.path.exists(archivo_ruta):
            os.remove(archivo_ruta)

        # Eliminar registro
        cur.execute("DELETE FROM materiales_didacticos WHERE material_id=%s", (material_id,))
        conn.commit()

        registrar_auditoria(
            docente_id=usuario_id,
            accion="eliminar_material",
            tabla_afectada="materiales_didacticos",
            registro_id=material_id,
            detalles={"titulo": titulo}
        )

        cur.close()
        return jsonify({"mensaje": "Material eliminado correctamente"}), 200

    except Exception:
        if 'conn' in locals():
            conn.rollback()
        print("❌ Error al eliminar material:")
        print(traceback.format_exc())
        return jsonify({"error": "Error interno al eliminar material"}), 500
