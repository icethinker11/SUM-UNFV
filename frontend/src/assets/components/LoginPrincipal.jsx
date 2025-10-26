import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./LoginPrincipal.css";

function LoginPrincipal({ onLoginSuccess }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home'); 
  const navigate = useNavigate(); 

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
      setActiveNav(id === 'hero' ? 'home' : id);
    }
  };

  return (
    <div className="login-pageprin">
      {/* NAVBAR */}
      <nav className="navbarprin">
        <div className="navbar-left">
          <img 
            src="/images/LogoUNFV.jpg" 
            alt="Logo UNFV" 
            className="unfv-logo-img" 
          />
        </div>

        <div className={`nav-links ${menuOpen ? "active" : ""}`}>
          <a 
            href="#hero" 
            onClick={(e) => { e.preventDefault(); scrollToSection("hero"); }}
            className={activeNav === 'home' ? 'nav-active' : ''}
          >
            HOME
          </a>
          <a 
            href="#about" 
            onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}
            className={activeNav === 'about' ? 'nav-active' : ''}
          >
            SOBRE NOSOTROS
          </a>
          <a 
            href="#contact" 
            onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}
            className={activeNav === 'contact' ? 'nav-active' : ''}
          >
            CONTACTO
          </a>
          <a 
            href="#role-selection" 
            onClick={(e) => { e.preventDefault(); scrollToSection("role-selection"); }}
            className={activeNav === 'role-selection' ? 'nav-active' : ''}
          >
            LOGIN
          </a>
        </div>

        <div className="navbar-right">
          <img 
            src="/images/LogoSun.png" 
            alt="Logo SUN Villarreal" 
            className="sun-logo-img" 
          />
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
        <div className="hero-content-overlay">
          <div className="hero-text-container">
            <h1>DESCUBRE UNA EXPERIENCIA DIGITAL RENOVADA CON</h1>
            <p className="platform-description">
              Plataforma integral para la gestión académica universitaria. Accede según tu rol para administrar y consultar información académica.
            </p>
            <button
              className="ingresar-button"
              onClick={() => scrollToSection("role-selection")}
            >
              Ingresar <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE ROLES */}
      <section id="role-selection" className="role-selection-section">
        <h2>Selecciona tu Tipo de Usuario</h2>
        <div className="role-cards-container">
          
          {/* ADMIN */}
          <div className="role-card admin-card">
            <div className="icon-container red"><i className="fas fa-user-tie">👤</i></div> 
            <h3>ADMINISTRADOR</h3>
            <p className="role-description">Gestiona el sistema completo, usuarios, cursos y configuraciones generales de la plataforma académica.</p>
            <ul className="features-list">
              <li><i className="fas fa-check-circle">✅</i> Gestión de usuarios y permisos</li>
              <li><i className="fas fa-check-circle">✅</i> Configuración del sistema</li>
              <li><i className="fas fa-check-circle">✅</i> Reportes y estadísticas</li>
            </ul>
            <button 
              className="role-button admin-button"
              onClick={() => navigate("/login/admin")}
            >
              Acceder como Administrador <span className="arrow">→</span>
            </button>
          </div>

          {/* DOCENTE */}
          <div className="role-card docente-card">
            <div className="icon-container blue"><i className="fas fa-chalkboard-teacher">🧑‍🏫</i></div> 
            <h3>DOCENTE</h3>
            <p className="role-description">Administra tus cursos, registra calificaciones y gestiona la información académica de tus estudiantes.</p>
            <ul className="features-list">
              <li><i className="fas fa-check-circle">✅</i> Registro de notas y evaluaciones</li>
              <li><i className="fas fa-check-circle">✅</i> Gestión de estudiantes</li>
              <li><i className="fas fa-check-circle">✅</i> Horarios y programación</li>
            </ul>
            <button 
              className="role-button docente-button"
              onClick={() => navigate("/login/docente")}
            >
              Acceder como Docente <span className="arrow">→</span>
            </button>
          </div>

          {/* ESTUDIANTE */}
          <div className="role-card estudiante-card">
            <div className="icon-container orange"><i className="fas fa-user-graduate">🎓</i></div>
            <h3>ESTUDIANTE</h3>
            <p className="role-description">Consulta tus calificaciones, horarios, información académica y realiza trámites estudiantiles.</p>
            <ul className="features-list">
              <li><i className="fas fa-check-circle">✅</i> Consulta de notas y promedios</li>
              <li><i className="fas fa-check-circle">✅</i> Horarios y calendario académico</li>
              <li><i className="fas fa-check-circle">✅</i> Trámites y solicitudes</li>
            </ul>
            <button 
              className="role-button estudiante-button"
              onClick={() => navigate("/login/alumno")}
            >
              Acceder como Estudiante <span className="arrow">→</span>
            </button>
          </div>

          {/* NUEVA TARJETA - APLICATIVO SUN */}
          <div className="role-card sun-card">
            <div className="icon-container green"><i className="fas fa-sun">☀️</i></div>
            <h3>APLICATIVO SUN</h3>
            <p className="role-description">Accede al sistema SUN para gestionar información institucional, reportes y herramientas administrativas.</p>
            <ul className="features-list">
              <li><i className="fas fa-check-circle">✅</i> Control de asistencia y rendimiento</li>
              <li><i className="fas fa-check-circle">✅</i> Reportes institucionales</li>
              <li><i className="fas fa-check-circle">✅</i> Acceso a herramientas del sistema</li>
            </ul>
            <button 
              className="role-button sun-button"
              onClick={() => navigate("/login/aplicativo")}
            >
              Ingresar<span className="arrow">→</span>
            </button>
          </div>

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

export default LoginPrincipal;
