from datetime import datetime
from database.db import get_db

# ==============================
# 🔹 FUNCIONES AUXILIARES
# ==============================

def dictfetchall(cursor):
    """Convierte el resultado de cursor.fetchall() en una lista de diccionarios."""
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

# ==============================
# 🔹 MODELOS SIMPLIFICADOS
# ==============================

class Calificacion:
    @staticmethod
    def obtener_por_docente(docente_id):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM calificaciones
            WHERE docente_id = %s
            ORDER BY fecha_registro DESC
        """, (docente_id,))
        datos = dictfetchall(cur)
        cur.close()
        return datos

    @staticmethod
    def registrar(estudiante_id, curso_id, docente_id, nota, periodo):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO calificaciones (estudiante_id, curso_id, docente_id, nota, periodo, fecha_registro)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING calificacion_id;
        """, (estudiante_id, curso_id, docente_id, nota, periodo, datetime.utcnow()))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return new_id


class MaterialDidactico:
    @staticmethod
    def obtener_por_docente(docente_id):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM materiales_didacticos
            WHERE docente_id = %s
            ORDER BY fecha_subida DESC
        """, (docente_id,))
        datos = dictfetchall(cur)
        cur.close()
        return datos

    @staticmethod
    def registrar(titulo, descripcion, curso_id, unidad, docente_id,
                  archivo_nombre, archivo_ruta, archivo_tipo, archivo_tamano):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO materiales_didacticos
            (titulo, descripcion, curso_id, unidad, docente_id, archivo_nombre,
             archivo_ruta, archivo_tipo, archivo_tamano, fecha_subida)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING material_id;
        """, (titulo, descripcion, curso_id, unidad, docente_id, archivo_nombre,
              archivo_ruta, archivo_tipo, archivo_tamano, datetime.utcnow()))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return new_id


class Asistencia:
    @staticmethod
    def registrar(estudiante_id, curso_id, docente_id, fecha_clase, estado, observaciones=None):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO asistencias
            (estudiante_id, curso_id, docente_id, fecha_clase, estado, observaciones, fecha_registro)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING asistencia_id;
        """, (estudiante_id, curso_id, docente_id, fecha_clase, estado, observaciones, datetime.utcnow()))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return new_id

    @staticmethod
    def obtener_por_docente(docente_id):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM asistencias
            WHERE docente_id = %s
            ORDER BY fecha_clase DESC
        """, (docente_id,))
        datos = dictfetchall(cur)
        cur.close()
        return datos


class AuditoriaDocente:
    @staticmethod
    def registrar(docente_id, accion, tabla_afectada, registro_id, detalles, ip_address):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO auditoria_docente
            (docente_id, accion, tabla_afectada, registro_id, detalles, timestamp, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (docente_id, accion, tabla_afectada, registro_id, detalles, datetime.utcnow(), ip_address))
        conn.commit()
        cur.close()
        return True
