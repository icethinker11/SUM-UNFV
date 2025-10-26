from flask import Blueprint, request, jsonify
from datetime import datetime
from database.db import get_db

bloques_horarios_bp = Blueprint('bloques_horarios', __name__)

# ======================================================
# 🕒 GESTIONAR BLOQUE HORARIO
# ======================================================

@bloques_horarios_bp.route("/bloques-horarios", methods=["POST"])
def crear_bloque_horario():
    data = request.json
    dia = data.get("dia")
    hora_inicio = data.get("hora_inicio")
    hora_fin = data.get("hora_fin")
    estado = data.get("estado")

    if not all([dia, hora_inicio, hora_fin, estado]):
        return jsonify({"error": "⚠️ Todos los campos obligatorios deben estar completos."}), 400

    formato = "%H:%M"
    inicio = datetime.strptime(hora_inicio, formato)
    fin = datetime.strptime(hora_fin, formato)
    duracion = (fin - inicio).total_seconds() / 3600

    if duracion <= 0:
        return jsonify({"error": "⛔ La hora de fin debe ser posterior a la de inicio."}), 400
    if duracion > 6:
        return jsonify({"error": "⛔ Un bloque no puede durar más de 6 horas."}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        # Evitar duplicado exacto
        cur.execute("""
            SELECT COUNT(*) 
            FROM bloque_horario 
            WHERE dia = %s AND hora_inicio = %s AND hora_fin = %s;
        """, (dia, hora_inicio, hora_fin))
        if cur.fetchone()[0] > 0:
            return jsonify({"error": f"⛔ Ya existe un bloque para {dia} entre {hora_inicio} y {hora_fin}."}), 400

        # Determinar turno (M/T/N)
        turno = "M" if inicio.hour < 12 else "T" if inicio.hour < 19 else "N"

        # Obtener el último número correlativo de ese día y turno
        cur.execute("""
            SELECT codigo_bloque 
            FROM bloque_horario 
            WHERE dia = %s AND codigo_bloque LIKE %s
            ORDER BY bloque_id DESC
            LIMIT 1;
        """, (dia, f"{dia[:3].upper()}-{turno}%"))

        ultimo_codigo = cur.fetchone()
        if ultimo_codigo and "-" in ultimo_codigo[0]:
            try:
                # extraer número al final, ej. "LUN-M3" -> 3
                parte_numerica = ''.join(ch for ch in ultimo_codigo[0] if ch.isdigit())
                siguiente_num = int(parte_numerica) + 1 if parte_numerica else 1
            except:
                siguiente_num = 1
        else:
            siguiente_num = 1

        # Crear nuevo código, ej. LUN-M1
        codigo_bloque = f"{dia[:3].upper()}-{turno}{siguiente_num}"

        # Insertar en BD
        cur.execute("""
            INSERT INTO bloque_horario (dia, hora_inicio, hora_fin, estado, codigo_bloque)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING bloque_id, codigo_bloque;
        """, (dia, hora_inicio, hora_fin, estado, codigo_bloque))

        bloque_id, codigo = cur.fetchone()
        conn.commit()

        return jsonify({
            "mensaje": "✅ Bloque horario registrado correctamente.",
            "bloque_id": bloque_id,
            "codigo_bloque": codigo
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error al registrar bloque horario:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


@bloques_horarios_bp.route("/bloques-horarios-listar", methods=["GET"])
def listar_bloques_horarios():
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            SELECT 
                bloque_id,
                codigo_bloque,
                dia,
                hora_inicio,
                hora_fin,
                estado
            FROM bloque_horario
            ORDER BY bloque_id ASC;
        """)

        data = cur.fetchall()
        columnas = [desc[0] for desc in cur.description]

        bloques = []
        for fila in data:
            bloque = dict(zip(columnas, fila))

            # ✅ Convertir los objetos time a string (HH:MM)
            if isinstance(bloque["hora_inicio"], (bytes, bytearray)):
                bloque["hora_inicio"] = bloque["hora_inicio"].decode("utf-8")
            else:
                bloque["hora_inicio"] = str(bloque["hora_inicio"])[:5]

            if isinstance(bloque["hora_fin"], (bytes, bytearray)):
                bloque["hora_fin"] = bloque["hora_fin"].decode("utf-8")
            else:
                bloque["hora_fin"] = str(bloque["hora_fin"])[:5]

            bloques.append(bloque)

        return jsonify(bloques), 200

    except Exception as e:
        print("❌ Error al listar bloques:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@bloques_horarios_bp.route("/bloques-horarios/<int:bloque_id>", methods=["PUT"])
def editar_bloque_horario(bloque_id):
    data = request.json
    dia = data.get("dia")
    hora_inicio = data.get("hora_inicio")
    hora_fin = data.get("hora_fin")
    estado = data.get("estado")

    if not all([dia, hora_inicio, hora_fin, estado]):
        return jsonify({"error": "⚠️ Todos los campos obligatorios deben estar completos."}), 400

    formato = "%H:%M"
    inicio = datetime.strptime(hora_inicio, formato)
    fin = datetime.strptime(hora_fin, formato)
    duracion = (fin - inicio).total_seconds() / 3600

    if duracion <= 0:
        return jsonify({"error": "⛔ La hora de fin debe ser posterior a la de inicio."}), 400
    if duracion > 6:
        return jsonify({"error": "⛔ Un bloque no puede durar más de 6 horas."}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        # ⚠️ Verificar duplicados (excluyendo el mismo bloque)
        cur.execute("""
            SELECT COUNT(*)
            FROM bloque_horario
            WHERE dia = %s AND hora_inicio = %s AND hora_fin = %s AND bloque_id != %s;
        """, (dia, hora_inicio, hora_fin, bloque_id))
        if cur.fetchone()[0] > 0:
            return jsonify({"error": f"⛔ Ya existe un bloque para {dia} entre {hora_inicio} y {hora_fin}."}), 400

        # 📌 Determinar nuevo turno y código si cambia hora/día
        turno = "M" if inicio.hour < 12 else "T" if inicio.hour < 19 else "N"
        cur.execute("""
            SELECT codigo_bloque
            FROM bloque_horario
            WHERE dia = %s AND codigo_bloque LIKE %s
            ORDER BY bloque_id DESC
            LIMIT 1;
        """, (dia, f"{dia[:3].upper()}-{turno}%"))
        ultimo_codigo = cur.fetchone()

        if ultimo_codigo and "-" in ultimo_codigo[0]:
            parte_numerica = ''.join(ch for ch in ultimo_codigo[0] if ch.isdigit())
            siguiente_num = int(parte_numerica) + 1 if parte_numerica else 1
        else:
            siguiente_num = 1

        codigo_bloque = f"{dia[:3].upper()}-{turno}{siguiente_num}"

        # ✏️ Actualizar bloque
        cur.execute("""
            UPDATE bloque_horario
            SET dia = %s, hora_inicio = %s, hora_fin = %s, estado = %s, codigo_bloque = %s
            WHERE bloque_id = %s
            RETURNING bloque_id, codigo_bloque;
        """, (dia, hora_inicio, hora_fin, estado, codigo_bloque, bloque_id))

        result = cur.fetchone()
        conn.commit()

        if not result:
            return jsonify({"error": "❌ Bloque no encontrado."}), 404

        return jsonify({
            "mensaje": "✅ Bloque horario actualizado correctamente.",
            "bloque_id": result[0],
            "codigo_bloque": result[1]
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error al editar bloque:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()


@bloques_horarios_bp.route("/bloques-horarios/<int:bloque_id>", methods=["DELETE"])
def eliminar_bloque_horario(bloque_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        # Verificar que exista
        cur.execute("SELECT bloque_id FROM bloque_horario WHERE bloque_id = %s;", (bloque_id,))
        if not cur.fetchone():
            return jsonify({"error": "❌ El bloque no existe."}), 404

        # Eliminar
        cur.execute("DELETE FROM bloque_horario WHERE bloque_id = %s;", (bloque_id,))
        conn.commit()

        return jsonify({"mensaje": "🗑️ Bloque horario eliminado correctamente."}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error al eliminar bloque:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()