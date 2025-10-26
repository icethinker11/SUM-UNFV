// src/components/LoginAdmin.jsx
import React, { useState } from "react";
import "./LoginAdmin.css"; // Se mantiene la importación del CSS con las clases 'login-admin__'

const LoginAdmin = ({ onLoginSuccess }) => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleLogin = async (e) => {
    // Evita el comportamiento por defecto de submit
    if (e) e.preventDefault();

    if (!correo || !contrasena) {
      setMensaje("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);
    setMensaje(""); // Limpia mensajes anteriores

    try {
      // Lógica de login específica para el Administrador
      const res = await fetch("http://localhost:5000/auth/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje(`Login de Administrador exitoso ✅ Bienvenido, ${data.nombre || "Admin"}`);
        // Pasa los datos del usuario logueado al componente padre
        onLoginSuccess(data);
      } else {
        setMensaje(`❌ Error: ${data.error || "Credenciales inválidas"}`);
      }
    } catch (err) {
      setMensaje("⚠️ Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-admin__container">
      {/* Capa oscura (aunque está oculta en el CSS, se mantiene por consistencia) */}
      <div className="login-admin__overlay"></div>

      {/* Tarjeta del formulario */}
      <div className="login-admin__card">
        {/* Encabezados */}
        <h2 className="login-admin__title">PORTAL DE ADMINISTRACIÓN</h2>
        <p className="login-admin__subtitle">FIIS - ESCUELA DE SISTEMAS</p>

        {/* Formulario de login */}
        <form onSubmit={handleLogin}>
          <div className="login-admin__field">
            <label className="login-admin__label">Correo de Administrador</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="login-admin__input"
              placeholder="admin@unfv.edu.pe"
              disabled={cargando}
            />
          </div>

          <div className="login-admin__field">
            <label className="login-admin__label">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="login-admin__input"
              placeholder="********"
              disabled={cargando}
            />
          </div>

          {/* Mensaje dinámico */}
          {mensaje && (
            <p
              className={`login-admin__message ${
                mensaje.includes("✅") ? "success" : "error"
              }`}
            >
              {mensaje}
            </p>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando}
            className="login-admin__button"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        {/* Enlace de recuperación */}
        <p className="login-admin__footer">
          © 2024 Universidad Nacional Federico Villareal. Todos los derechos reservados.{" "}
           <p className="login-admin__ea"> Términos de Uso • Privacidad • Soporte </p>
        </p>
      </div>
    </div>
  );
};

export default LoginAdmin;