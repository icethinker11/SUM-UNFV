import { Link } from "react-router-dom";
import './styles/sidebar-docente.css';

function SidebarDocente({ usuario }) {
  return (
    <div className="sidebar-docente">
      <h2>👨‍🏫 Docente</h2>
      <p>Usuario ID: {usuario.usuario_id}</p>
      <nav>
        <Link to="/docente/registrar-nota">
          📝 Registrar Calificación
        </Link>
        <Link to="/docente/subir-material">
          📂 Subir Material Didáctico
        </Link>
        <Link to="/docente/asistencia">
          📋 Tomar Asistencia
        </Link>
      </nav>
    </div>
  );
}

export default SidebarDocente;