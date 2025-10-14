import { Link } from "react-router-dom";
import "./styles/sidebar-admin.css";

function SidebarAdmin({ usuario }) {
  return (
    <div className="sidebar-admin">
      {/* Encabezado */}
      <div className="sidebar-header">
        <h2>PORTAL ADMINISTRADOR</h2>
        <p>Sistema Académico</p>
      </div>

      {/* Información del usuario */}
      <div className="user-info">
        <p className="user-id">Usuario ID: {usuario.usuario_id}</p>
        <p className="user-name">
          Admin ({usuario.nombres || "Administrador"})
        </p>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <Link to="/admin/crear-docente">
          <span className="nav-icon">🧑‍🏫</span>
          Crear Docente
        </Link>
        <Link to="/admin/crear-estudiante">
          <span className="nav-icon">🎓</span>
          Crear Estudiante
        </Link>
        <Link to="/admin/aprobar-matricula">
          <span className="nav-icon">✅</span>
          Aprobar Matrícula
        </Link>
        <Link to="/admin/rechazar-matricula">
          <span className="nav-icon">❌</span>
          Rechazar Matrícula
        </Link>
        <Link to="/admin/asignar-aula">
          <span className="nav-icon">🏫</span>
          Asignar Aula
        </Link>

        {/* 🔹 Nueva sección: Modificación de datos */}
        <h3 className="sidebar-section">Gestión de Usuarios</h3>
        <Link to="/admin/gestion-docentes">
          <span className="nav-icon">✏️</span>
          Modificar Datos Docente
        </Link>
        <Link to="/admin/gestion-alumnos">
          <span className="nav-icon">📖</span>
          Modificar Datos Estudiante
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p>© 2024 Sistema Académico</p>
      </div>
    </div>
  );
}

export default SidebarAdmin;
