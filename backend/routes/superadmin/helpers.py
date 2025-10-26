import random
import string
import re
from flask_mail import Message
from extensions import mail
from flask import current_app


# ======================================================
# 🧩 FUNCIONES AUXILIARES
# ======================================================

def generar_correo_institucional(nombres, apellidos):
    partes_nombre = (nombres or "").strip().split()
    partes_apellido = (apellidos or "").strip().split()
    inicial_nombre = partes_nombre[0][0].lower() if partes_nombre else ""
    primer_apellido = partes_apellido[0].lower() if partes_apellido else ""
    inicial_segundo_apellido = partes_apellido[1][0].lower() if len(partes_apellido) > 1 else ""
    return f"{inicial_nombre}{primer_apellido}{inicial_segundo_apellido}@unfv.edu.pe"

def generar_contrasena(longitud=10):
    caracteres = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(caracteres) for _ in range(longitud))

def validar_telefono(telefono):
    return bool(re.fullmatch(r"\d{9}", (telefono or "")))

def validar_dni(dni):
    return bool(re.fullmatch(r"\d{8}", (dni or "")))

# ======================================================
# ✉️ ENVÍO DE CREDENCIALES CON HTML PROFESIONAL
# ======================================================
def enviar_credenciales(correo_destino, correo_institucional, contrasena):
    try:
        html_body = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <div style="text-align: center; border-bottom: 3px solid #004080; padding-bottom: 10px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Logo_UNFV.png" alt="UNFV" width="90"/>
                <h2 style="color: #004080;">Universidad Nacional Federico Villarreal</h2>
            </div>
            <p>¡Bienvenido(a) al <strong>Sistema de Gestión UNFV</strong>!</p>
            <p>Se han generado tus credenciales institucionales de acceso:</p>

            <table style="border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <td style="padding: 6px 10px; font-weight: bold;">Correo institucional:</td>
                    <td style="padding: 6px 10px; background: #f4f4f4;">{correo_institucional}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 10px; font-weight: bold;">Contraseña:</td>
                    <td style="padding: 6px 10px; background: #f4f4f4;">{contrasena}</td>
                </tr>
            </table>

            <p style="margin-top: 20px;">Por favor, cambia tu contraseña después de iniciar sesión.</p>
            <hr style="margin-top: 30px; border: 1px solid #ccc;"/>
            <p style="font-size: 12px; text-align: center; color: #666;">
                Este correo fue generado automáticamente por el sistema UNFV.<br/>
                Si no solicitaste este acceso, ignora este mensaje.
            </p>
        </div>
        """

        msg = Message(
            subject="🎓 Credenciales de acceso - Sistema UNFV",
            recipients=[correo_destino],
            html=html_body
        )

        # Aseguramos el contexto de la app Flask
        with current_app.app_context():
            mail.send(msg)

        print(f"✅ Correo enviado correctamente a {correo_destino}")
        return True
    except Exception as e:
        print("❌ Error al enviar correo:", str(e))
        return False