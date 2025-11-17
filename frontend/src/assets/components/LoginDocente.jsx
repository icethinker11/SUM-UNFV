import React, { useState } from "react";
import "./LoginDocente.css";

const LoginDocente = ({ onLoginSuccess }) => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!correo || !contrasena) {
      setMensaje("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      const res = await fetch("http://localhost:5000/auth/login/docente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje(`✅ Bienvenido, ${data.nombre || "Docente"}`);

        // ✅ CORRECCIÓN: Usar sessionStorage en lugar de localStorage
        // sessionStorage aísla los datos a la pestaña actual, evitando la superposición.
        sessionStorage.setItem("usuario_id", data.usuario_id);
        sessionStorage.setItem("docente_id", data.docente_id);
        sessionStorage.setItem("nombre_docente", data.nombre);
        sessionStorage.setItem("rol", data.rol);

        // 🧩 Pasar la información al componente principal (App.jsx)
        onLoginSuccess(data);
      } else {
        setMensaje(`❌ Error: ${data.error || "Credenciales inválidas"}`);
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setMensaje("⚠️ Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-docente__container">
      <div className="login-docente__overlay"></div>

      <div className="login-docente__card">
        <h2 className="login-docente__title">PORTAL DE DOCENTES</h2>
        <p className="login-docente__subtitle">FIIS - ESCUELA DE SISTEMAS</p>

        <form onSubmit={handleLogin}>
          <div className="login-docente__field">
            <label className="login-docente__label">Correo de Docente</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="login-docente__input"
              placeholder="docente@unfv.edu.pe"
              disabled={cargando}
            />
          </div>

          <div className="login-docente__field">
            <label className="login-docente__label">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="login-docente__input"
              placeholder="********"
              disabled={cargando}
            />
          </div>

          {mensaje && (
            <p
              className={`login-docente__message ${
                mensaje.includes("✅") ? "success" : "error"
              }`}
            >
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="login-docente__button"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p className="login-docente__footer">
          © 2024 Universidad Nacional Federico Villareal. Todos los derechos reservados.
        </p>
        <p className="login-docente__ea">Términos de Uso • Privacidad • Soporte</p>
      </div>
    </div>
  );
};

export default LoginDocente;