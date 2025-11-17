import { Link, useLocation } from "react-router-dom";
import './styles/sidebar-docente.css';

function SidebarDocente({ usuario }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="sidebar-docente">
      <div className="sidebar-header">
        <h2>👨‍🏫 Panel Docente</h2>
        <div className="user-info">
          <p className="user-name">{usuario.nombre || 'Docente'}</p>
          <p className="user-id">ID: {usuario.usuario_id}</p>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <Link 
          to="/docente/perfil" 
          className={`nav-link ${isActive('/docente/perfil')}`}
        >
          <span className="icon">👤</span>
          <span className="text">Mi Perfil</span>
        </Link>

        <Link 
          to="/docente/registrar-nota" 
          className={`nav-link ${isActive('/docente/registrar-nota')}`}
        >
          <span className="icon">📝</span>
          <span className="text">Registrar Calificación</span>
        </Link>

        <Link 
          to="/docente/subir-material" 
          className={`nav-link ${isActive('/docente/subir-material')}`}
        >
          <span className="icon">📂</span>
          <span className="text">Subir Material</span>
        </Link>

        <Link 
          to="/docente/calendario" 
          className={`nav-link ${isActive('/docente/calendario')}`}
        >
          <span className="icon">📆</span>
          <span className="text">Mi Calendario</span>
        </Link>

        <Link 
          to="/docente/asistencia" 
          className={`nav-link ${isActive('/docente/asistencia')}`}
        >
          <span className="icon">📋</span>
          <span className="text">Tomar Asistencia</span>
        </Link>

        <Link 
          to="/docente/reportes" 
          className={`nav-link ${isActive('/docente/reportes')}`}
        >
          <span className="icon">📊</span>
          <span className="text">Reportes</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <Link to="/logout" className="logout-link">
          <span className="icon">🚪</span>
          <span className="text">Cerrar Sesión</span>
        </Link>
      </div>
    </div>
  );
}

export default SidebarDocente;
