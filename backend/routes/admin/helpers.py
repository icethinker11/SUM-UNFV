import re
from flask_mail import Message
from extensions import mail
from flask import current_app


# ======================================================
# 🧩 FUNCIONES DE VALIDACIÓN
# ======================================================

def validar_correo(correo, rol):
    """Valida que el correo tenga el dominio correcto según el rol"""
    dominios = {
        "Docente": "@docenteunfv.edu.pe",
        "Alumno": "@alumnounfv.edu.pe"
    }
    return correo.endswith(dominios.get(rol, ""))


def validar_telefono(telefono):
    """Valida que el teléfono tenga exactamente 9 dígitos"""
    if not telefono:
        return False
    return bool(re.fullmatch(r'\d{9}', telefono))


def validar_dni(dni):
    """Valida que el DNI tenga exactamente 8 dígitos"""
    if not dni:
        return False
    return bool(re.fullmatch(r'\d{8}', dni))


# ======================================================
# ✉️ ENVÍO DE CREDENCIALES A ESTUDIANTES
# ======================================================

def enviar_credenciales_estudiante(
    correo_destino, 
    nombre_completo, 
    correo_institucional, 
    contrasena_temporal,
    codigo_universitario
):
    """
    Envía correo de bienvenida con credenciales al estudiante.
    
    Args:
        correo_destino: Correo personal del estudiante
        nombre_completo: Nombre completo del estudiante
        correo_institucional: Correo institucional (@alumnounfv.edu.pe)
        contrasena_temporal: Contraseña temporal generada
        codigo_universitario: Código universitario del estudiante
    
    Returns:
        bool: True si se envió correctamente, False en caso contrario
    """
    try:
        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ce3622 0%, #f75555 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 26px;">🎓 Sistema Académico UNFV</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                    Universidad Nacional Federico Villarreal
                </p>
            </div>
            
            <!-- Body -->
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <p style="font-size: 18px; color: #ce3622; margin-bottom: 10px;">
                    ¡Bienvenido(a), <strong>{nombre_completo}</strong>!
                </p>
                
                <p style="color: #555; line-height: 1.6;">
                    Te damos la más cordial bienvenida a la <strong>Escuela Profesional de Ingeniería de Sistemas</strong>.
                </p>
                
                <p style="color: #555; line-height: 1.6;">
                    Tu cuenta en el Sistema Académico ha sido creada exitosamente. A continuación, encontrarás tus credenciales de acceso:
                </p>
                
                <!-- Credentials Box -->
                <div style="background: linear-gradient(135deg, #fef7ff 0%, #fff5f5 100%); border-left: 4px solid #ce3622; padding: 25px; margin: 25px 0; border-radius: 8px;">
                    <h3 style="color: #ce3622; margin-top: 0; margin-bottom: 20px; font-size: 16px;">
                        📋 Tus Credenciales de Acceso
                    </h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                                <span style="color: #666; font-size: 14px; font-weight: 600;">Código Universitario:</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0 16px 0;">
                                <span style="color: #ce3622; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">
                                    {codigo_universitario}
                                </span>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                                <span style="color: #666; font-size: 14px; font-weight: 600;">Usuario (Correo Institucional):</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0 16px 0;">
                                <span style="color: #ce3622; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">
                                    {correo_institucional}
                                </span>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                                <span style="color: #666; font-size: 14px; font-weight: 600;">Contraseña Temporal:</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="color: #ce3622; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">
                                    {contrasena_temporal}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Warning Box -->
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold; font-size: 14px;">
                        ⚠️ IMPORTANTE:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px;">
                        <li style="margin: 5px 0;">Esta es una contraseña temporal que debes cambiar en tu primer inicio de sesión.</li>
                        <li style="margin: 5px 0;">Guarda estas credenciales en un lugar seguro.</li>
                        <li style="margin: 5px 0;">No compartas tu contraseña con nadie.</li>
                    </ul>
                </div>
                
                <!-- Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/login/alumno" 
                       style="display: inline-block; padding: 14px 40px; background-color: #ce3622; color: white; 
                              text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 6px rgba(206, 54, 34, 0.3);">
                        Iniciar Sesión Ahora
                    </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666; line-height: 1.6;">
                    Si tienes alguna duda o problema con tu acceso, por favor contacta con el área de soporte técnico.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0; margin-top: 20px;">
                <p style="margin: 5px 0; font-size: 14px; color: #333; font-weight: bold;">
                    Escuela Profesional de Ingeniería de Sistemas
                </p>
                <p style="margin: 5px 0; font-size: 13px; color: #666;">
                    Universidad Nacional Federico Villarreal
                </p>
                <p style="margin: 10px 0 5px 0; font-size: 12px; color: #999;">
                    Este es un correo automático, por favor no responder.
                </p>
            </div>
            
        </div>
        """

        # Crear mensaje
        msg = Message(
            subject="🎓 Bienvenido al Sistema Académico UNFV - Credenciales de Acceso",
            recipients=[correo_destino],
            html=html_body
        )

        # Enviar con el contexto de Flask
        with current_app.app_context():
            mail.send(msg)

        print(f"✅ Correo de credenciales enviado correctamente a {correo_destino}")
        return True

    except Exception as e:
        print(f"❌ Error al enviar correo a {correo_destino}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# ======================================================
# ✉️ ENVÍO DE CORREO DE RECUPERACIÓN
# ======================================================

def enviar_correo_recuperacion(correo_destino, nombre_completo, token_recuperacion):
    """
    Envía correo para recuperación de contraseña.
    
    Args:
        correo_destino: Correo del usuario
        nombre_completo: Nombre completo del usuario
        token_recuperacion: Token único para recuperación
    
    Returns:
        bool: True si se envió correctamente, False en caso contrario
    """
    try:
        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            
            <div style="background: linear-gradient(135deg, #ce3622 0%, #f75555 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Recuperación de Contraseña</h1>
            </div>
            
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; color: #333;">
                    Hola <strong>{nombre_completo}</strong>,
                </p>
                
                <p style="color: #555; line-height: 1.6;">
                    Hemos recibido una solicitud para restablecer tu contraseña del Sistema Académico UNFV.
                </p>
                
                <p style="color: #555; line-height: 1.6;">
                    Haz clic en el siguiente botón para crear una nueva contraseña:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/reset-password?token={token_recuperacion}" 
                       style="display: inline-block; padding: 14px 40px; background-color: #ce3622; color: white; 
                              text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Restablecer Contraseña
                    </a>
                </div>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold; font-size: 14px;">
                        ⚠️ Importante:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px;">
                        <li style="margin: 5px 0;">Este enlace expirará en 1 hora</li>
                        <li style="margin: 5px 0;">Si no solicitaste este cambio, ignora este correo</li>
                    </ul>
                </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                    Sistema Académico UNFV - Este es un correo automático
                </p>
            </div>
            
        </div>
        """

        msg = Message(
            subject="🔐 Recuperación de Contraseña - Sistema UNFV",
            recipients=[correo_destino],
            html=html_body
        )

        with current_app.app_context():
            mail.send(msg)

        print(f"✅ Correo de recuperación enviado a {correo_destino}")
        return True

    except Exception as e:
        print(f"❌ Error al enviar correo de recuperación: {str(e)}")
        return False