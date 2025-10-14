import { useState } from "react";
import "./Login.css";

function Login({ onLoginSuccess }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("Login exitoso ✅");
        onLoginSuccess(data);
      } else {
        setMensaje(data.error || "Error en el login");
      }
    } catch (err) {
      setMensaje("Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-page">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">FIIS Villarreal</div>
        <div className={`nav-links ${menuOpen ? "active" : ""}`}>
          <a href="#hero">Inicio</a>
          <a href="#about">Nosotros</a>
          <a href="#contact">Contáctanos</a>
          <a href="#login-form">Login</a>
        </div>
        <div
          className={`menu-toggle ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-content">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/67/UNFV_logo.png"
            alt="UNFV Logo"
            className="hero-logo"
          />
          <h1>Bienvenido al Portal FIIS</h1>
          <p>
            La Universidad Nacional Federico Villarreal, formando profesionales
            líderes en Ingeniería Industrial y de Sistemas.
          </p>
          <a href="#login-form" className="scroll-down">Ir al login ↓</a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="info-section">
        <h2>Sobre Nosotros</h2>
        <p>
          La Facultad de Ingeniería Industrial y de Sistemas impulsa la
          innovación, la investigación y el desarrollo de proyectos que
          transforman la sociedad. Aquí podrás informarte sobre nuestros
          programas, cursos y actividades.
        </p>
      </section>

      {/* Contact Section */}
      <section id="contact" className="info-section">
        <h2>Contáctanos</h2>
        <p>
          📧 contacto@fiis.unfv.edu.pe <br />
          ☎️ (01) 748-0888 <br />
          📍 Av. Nicolás de Piérola 351, Lima - Perú
        </p>
      </section>

      {/* Login Section */}
      <section id="login-form" className="form-section">
        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Correo"
          />
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="Contraseña"
          />
          <button onClick={handleLogin}>Entrar</button>
          {mensaje && <p className="mensaje">{mensaje}</p>}
        </div>
      </section>
      {/* Footer */}
<footer className="footer">
  <p>© 2025 Universidad Nacional Federico Villarreal - FIIS</p>
  <div className="social-links">
    <a href="https://www.facebook.com/unfv.oficial" target="_blank" rel="noreferrer">Facebook</a>
    <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
    <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
  </div>
</footer>

    </div>
  );
}

export default Login;
