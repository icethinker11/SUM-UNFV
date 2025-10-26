import os
from dotenv import load_dotenv

# Carga las variables del archivo .env
load_dotenv()

class Config:
    """Configuración base compartida"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'una-clave-secreta-por-defecto-muy-dificil')
    DEBUG = False
    TESTING = False

    # --- Configuración de Flask-Mail ---
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_USERNAME") # ✅ usa solo el correo, no tupla

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
