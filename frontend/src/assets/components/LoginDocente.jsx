import React, { useState } from "react";
// Importamos un CSS específico para Docentes (se asume que se creará este archivo)
import "./LoginDocente.css"; 

const LoginDocente = ({ onLoginSuccess }) => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleLogin = async (e) => {
    // Previene el comportamiento por defecto de submit del formulario
    if (e) e.preventDefault(); 
    
    if (!correo || !contrasena) {
      setMensaje("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);
    setMensaje(""); // Limpiar mensaje anterior
    
    try {
      // Lógica de login específica para el Docente usando la ruta correcta
      const res = await fetch("http://localhost:5000/auth/login/docente", { // RUTA DE API PARA DOCENTES
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje(`Login de Docente exitoso ✅ Bienvenido, ${data.nombre || 'Docente'}`);
        // Asume que data contiene nombre, rol y token
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
    // Se usa 'login-docente__container'
    <div className="login-docente__container">
      {/* Capa oscura */}
      <div className="login-docente__overlay"></div> 

      {/* Tarjeta del formulario (con clase 'login-docente__card') */}
      <div className="login-docente__card">
        {/* Títulos adaptados para Docentes */}
        <h2 className="login-docente__title">PORTAL DE DOCENTES</h2> 
        <p className="login-docente__subtitle">FIIS - ESCUELA DE SISTEMAS</p>

        {/* Formulario que usa la función handleLogin */}
        <form onSubmit={handleLogin}>
          
          <div className="login-docente__field">
            <label className="login-docente__label">Correo de Docente</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="login-docente__input"
              placeholder="docente@unfv.edu.pe" // Placeholder específico
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
          
          {/* Mensaje de error/éxito */}
          {mensaje && <p className={`login-docente__message ${mensaje.includes('✅') ? 'success' : 'error'}`}>{mensaje}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="login-docente__button"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p className="login-docente__footer">
          © 2024 Universidad Nacional Federico Villareal. Todos los derechos reservados.{" "}
          
          <p className="login-docente__ea"> Términos de Uso • Privacidad • Soporte </p>
        </p>
      </div>
    </div>
  );
};

export default LoginDocente;