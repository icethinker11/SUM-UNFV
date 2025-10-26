import React, { useState } from "react";
import "./LoginAplicativo.css";

const LoginAplicativo = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario || !clave) {
      alert("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/auth/login/aplicativo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: usuario, contrasena: clave }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`✅ Bienvenido, ${data.rol}`);
        onLoginSuccess({
          nombre: data.nombre || "Super Administrador",
          rol: data.rol || "SuperAdmin",
          token: data.token,
        });
      } else {
        alert(`❌ Error: ${data.error || "Credenciales inválidas"}`);
      }
    } catch (error) {
      alert("⚠️ No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-aplicativo__container">
      {/* Capa oscura */}
      <div className="login-aplicativo__overlay"></div>

      {/* Tarjeta del formulario */}
      <div className="login-aplicativo__card">
        <h2 className="login-aplicativo__title">PORTAL SUPER-ADMIN</h2>
        <p className="login-aplicativo__subtitle">FIIS - ESCUELA DE SISTEMAS</p>

        <form onSubmit={handleSubmit}>
          <div className="login-aplicativo__field">
            <label className="login-aplicativo__label">Correo de Docente</label>
            <input
              type="email"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="login-aplicativo__input"
              placeholder="ejemplo@unfv.edu.pe"
            />
          </div>

          <div className="login-aplicativo__field">
            <label className="login-aplicativo__label">Contraseña</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="login-aplicativo__input"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="login-aplicativo__button"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p className="login-aplicativo__footer">
          © 2024 Universidad Nacional Federico Villareal. Todos los derechos reservados.{" "}
          <p className="login-aplicativo__ea"> Términos de Uso • Privacidad • Soporte </p>
        </p>
      </div>
    </div>
  );
};

export default LoginAplicativo;
