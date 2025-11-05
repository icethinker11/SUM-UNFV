import re
from werkzeug.security import check_password_hash

class PerfilValidator:
    
    @staticmethod
    def validar_email(email):
        """Valida el formato del email"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return False, 'Formato de email inválido'
        return True, None
    
    @staticmethod
    def validar_telefono(telefono):
        """Valida el formato del teléfono"""
        telefono = telefono.strip()
        if not telefono.isdigit() or len(telefono) < 9:
            return False, 'Formato de teléfono inválido. Debe contener al menos 9 dígitos'
        return True, None
    
    @staticmethod
    def validar_password(password):
        """Valida que la contraseña cumpla con los requisitos de seguridad"""
        if len(password) < 8:
            return False, "La contraseña debe tener al menos 8 caracteres"
        
        tiene_mayuscula = any(c.isupper() for c in password)
        tiene_minuscula = any(c.islower() for c in password)
        tiene_numero = any(c.isdigit() for c in password)
        
        if not (tiene_mayuscula and tiene_minuscula and tiene_numero):
            return False, "La contraseña debe incluir mayúsculas, minúsculas y números"
        
        return True, "Contraseña válida"
    
    @staticmethod
    def validar_password_actual(docente, password_actual):
        """Verifica que la contraseña actual sea correcta"""
        if not check_password_hash(docente.password, password_actual):
            return False, 'Contraseña actual incorrecta'
        return True, None