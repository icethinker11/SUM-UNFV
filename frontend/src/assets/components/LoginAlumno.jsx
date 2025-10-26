import React, { useState } from "react";
// Se asume que habrá un archivo de estilos específico para el alumno,
// o que se usará el mismo con clases únicas. Aquí se crea un placeholder.
import "./LoginAlumno.css"; // Nueva importación del CSS con las clases 'login-alumno__'

const LoginAlumno = ({ onLoginSuccess }) => {
  const [codigo, setCodigo] = useState(""); // Cambiado de 'correo' a 'codigo' (código de matrícula o estudiante)
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleLogin = async (e) => {
    // Evita el comportamiento por defecto de submit
    if (e) e.preventDefault();

    if (!codigo || !contrasena) {
      setMensaje("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);
    setMensaje(""); // Limpia mensajes anteriores

    try {
      // Lógica de login específica para el Alumno
      const res = await fetch("http://localhost:5000/auth/login/alumno", { // <-- Endpoint actualizado para alumnos
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Se envía 'codigo' en lugar de 'correo'
        body: JSON.stringify({ codigo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje(`Login de Alumno exitoso ✅ Bienvenido, ${data.nombre || "Alumno"}`);
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
    <div className="login-alumno__container">
      {/* Capa oscura (opcional, replicando la estructura) */}
      <div className="login-alumno__overlay"></div>

      {/* Tarjeta del formulario */}
      <div className="login-alumno__card">
        {/* Encabezados */}
        <h2 className="login-alumno__title">PORTAL DE ALUMNOS</h2>
        <p className="login-alumno__subtitle">FIIS - ESCUELA DE SISTEMAS</p>

        {/* Formulario de login */}
        <form onSubmit={handleLogin}>
          <div className="login-alumno__field">
            {/* Cambiado el label de "Correo de Administrador" a "Código de Matrícula" */}
            <label className="login-alumno__label">Código de Matrícula</label>
            <input
              type="text" // Cambiado a 'text' para el código de matrícula
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="login-alumno__input"
              placeholder="Ej: 2020202020" // Placeholder ajustado
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

          {/* Mensaje dinámico */}
          {mensaje && (
            <p
              className={`login-alumno__message ${
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
            className="login-alumno__button"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        {/* Enlace de recuperación */}
        <p className="login-alumno__footer">
          © 2024 Universidad Nacional Federico Villareal. Todos los derechos reservados.{" "}
          <p className="login-alumno__ea"> Términos de Uso • Privacidad • Soporte </p>
        </p>
      </div>
    </div>
  );
};

export default LoginAlumno;