from flask import request, jsonify
from . import docentes_bp
from database.db import get_db
from datetime import datetime


# ====== FUNCIÓN PARA CALCULAR PROMEDIO ======
def calcular_promedio(data):
    practicas = float(data.get("practicas", 0) or 0)
    parcial = float(data.get("parcial", 0) or 0)
    final = float(data.get("final", 0) or 0)
    sustitutorio = float(data.get("sustitutorio", 0) or 0)
    aplazado = float(data.get("aplazado", 0) or 0)

    # Sustitutorio reemplaza la menor nota entre parcial y final
    if sustitutorio > 0:
        if parcial < final:
            parcial = sustitutorio
        else:
            final = sustitutorio

    # Cálculo ponderado
    promedio = (practicas * 0.4) + (parcial * 0.3) + (final * 0.3)

    # Si el estudiante desaprueba (<11) y tiene aplazado, se recalcula
    if promedio < 11 and aplazado > 0:
        promedio = (promedio + aplazado) / 2

    estado = "Aprobado" if promedio >= 11 else "Desaprobado"
    return round(promedio, 2), estado


# ====== ENDPOINT PARA REGISTRAR / ACTUALIZAR CALIFICACIONES ======
@docentes_bp.route("/calificaciones", methods=["POST"])
def registrar_calificaciones():
    """
    Permite al docente registrar o actualizar las calificaciones de un estudiante.
    Aplica la lógica de ponderaciones:
    - Prácticas 40%
    - Parcial 30%
    - Final 30%
    - Sustitutorio reemplaza la menor nota (parcial o final)
    - Aplazado promedia si sigue desaprobado
    """
    try:
        data = request.get_json()
        estudiante_id = data.get("estudiante_id")
        curso_id = data.get("curso_id")

        if not estudiante_id or not curso_id:
            return jsonify({"error": "Faltan campos requeridos"}), 400

        promedio, estado = calcular_promedio(data)

        conn = get_db()
        cur = conn.cursor()

        # Verificar si ya existe registro
        cur.execute("""
            SELECT 1 FROM calificaciones
            WHERE estudiante_id = %s AND curso_id = %s
        """, (estudiante_id, curso_id))
        existe = cur.fetchone()

        if existe:
            # Actualizar
            cur.execute("""
                UPDATE calificaciones
                SET practicas = %s, parcial = %s, final = %s,
                    sustitutorio = %s, aplazado = %s,
                    promedio = %s, estado = %s, fecha_modificacion = %s
                WHERE estudiante_id = %s AND curso_id = %s
            """, (
                data.get("practicas"), data.get("parcial"), data.get("final"),
                data.get("sustitutorio"), data.get("aplazado"),
                promedio, estado, datetime.utcnow(), estudiante_id, curso_id
            ))
            mensaje = "✅ Calificaciones actualizadas correctamente"
        else:
            # Insertar
            cur.execute("""
                INSERT INTO calificaciones (
                    estudiante_id, curso_id, practicas, parcial, final,
                    sustitutorio, aplazado, promedio, estado, fecha_registro
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                estudiante_id, curso_id, data.get("practicas"), data.get("parcial"),
                data.get("final"), data.get("sustitutorio"), data.get("aplazado"),
                promedio, estado, datetime.utcnow()
            ))
            mensaje = "✅ Calificaciones registradas correctamente"

        conn.commit()
        cur.close()

        return jsonify({
            "mensaje": mensaje,
            "promedio": promedio,
            "estado": estado
        }), 200

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": str(e)}), 500
