import os
from dotenv import load_dotenv

# Carga las variables del archivo .env en el entorno del sistema
load_dotenv()

class Config:
    """
    Configuración base que contiene valores compartidos por todos los entornos.
    """
    # Clave secreta para proteger las sesiones de Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'una-clave-secreta-por-defecto-muy-dificil')
    DEBUG = False
    TESTING = False
    
    # --- Configuración de Flask-Mail ---
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    # Lee las credenciales del correo desde el archivo .env
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = ("Sistema UNFV", os.getenv('MAIL_USERNAME'))

class DevelopmentConfig(Config):
    """
    Configuración para el entorno de desarrollo. Activa el modo DEBUG.
    """
    DEBUG = True

class ProductionConfig(Config):
    """
    Configuración para el entorno de producción. Mantiene el modo DEBUG desactivado.
    """
    DEBUG = False

# Diccionario para seleccionar la configuración por nombre
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}