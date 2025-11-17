import React, { useState } from "react";
import "./LoginAlumno.css"; // Asegúrate de tener los estilos con el prefijo 'login-alumno__'

const LoginAlumno = ({ onLoginSuccess }) => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!correo || !contrasena) {
      setMensaje("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      const res = await fetch("http://localhost:5000/auth/login/alumno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }), // ✅ Ahora se envía 'correo'
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje(`✅ Bienvenido, ${data.nombre || "Alumno"}`);
        onLoginSuccess(data); // Envía los datos al componente padre
      } else {
        setMensaje(`❌ Error: ${data.error || "Credenciales inválidas"}`);
      }
    } catch (err) {
      console.error(err);
      setMensaje("⚠️ Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-alumno__container">
      <div className="login-alumno__overlay"></div>

      <div className="login-alumno__card">
        <h2 className="login-alumno__title">PORTAL DE ALUMNOS</h2>
        <p className="login-alumno__subtitle">FIIS - ESCUELA DE SISTEMAS</p>

        <form onSubmit={handleLogin}>
          <div className="login-alumno__field">
            <label className="login-alumno__label">Correo institucional</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="login-alumno__input"
              placeholder="Ej: alumno@unfv.edu.pe"
              disabled={cargando}
            />
          </div>

          <div className="login-alumno__field">
            <label className="login-alumno__label">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="login-alumno__input"
              placeholder="********"
              disabled={cargando}
            />
          </div>

          {mensaje && (
            <p
              className={`login-alumno__message ${
                mensaje.includes("✅") ? "success" : "error"
              }`}
            >
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="login-alumno__button"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p className="login-alumno__footer">
          © 2024 Universidad Nacional Federico Villareal. Todos los derechos
          reservados.{" "}
          <p className="login-alumno__ea">
            Términos de Uso • Privacidad • Soporte
          </p>
        </p>
      </div>
    </div>
  );
};

export default LoginAlumno;
