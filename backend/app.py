from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
from routes.auth_routes import auth_bp
from routes.superadmin_routes import superadmin_bp
from routes.admin_routes import admin_bp
from routes.curso_routes import curso_bp
from database.db import init_db
from extensions import mail  # usamos la instancia global

app = Flask(__name__)
CORS(app)

# 🔧 Configuración del correo Gmail
app.config.update(
    MAIL_SERVER="smtp.gmail.com",
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME="mllashag2006@gmail.com",  # ✅ Tu correo Gmail
    MAIL_PASSWORD="yvuk jumo uaug oylc",     # ✅ Contraseña de aplicación Gmail
    MAIL_DEFAULT_SENDER=("Sistema UNFV", "mllashag2006@gmail.com"),
)

# Inicializar extensiones
mail.init_app(app)
init_db(app)

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(superadmin_bp, url_prefix="/superadmin")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(curso_bp, url_prefix="/curso")

@app.route("/")
def home():
    return {"mensaje": "API Flask SUM_UNFV_3.0 corriendo 🚀"}

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
