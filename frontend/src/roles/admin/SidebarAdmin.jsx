import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./styles/sidebar-admin.css";

function SidebarAdmin({ usuario }) {
  const [colapsado, setColapsado] = useState(false);

  return (
    <div className={`sidebar-admin ${colapsado ? "collapsed" : ""}`}>
      {/* Botón de colapsar */}
      <button
        className="collapse-btn"
        onClick={() => setColapsado(!colapsado)}
        title={colapsado ? "Expandir menú" : "Colapsar menú"}
      >
        {colapsado ? <ChevronRight /> : <ChevronLeft />}
      </button>

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
        <h3 className="sidebar-section">Mi Cuenta</h3>
        <Link to="/admin/mi-perfil">
          <span className="nav-icon">👤</span>
          <span className="nav-text">Mi Perfil</span>
        </Link>

        <h3 className="sidebar-section">Gestión de Personal</h3>
        <Link to="/admin/crear-docente">
          <span className="nav-icon">🧑</span>
          <span className="nav-text">Crear Docente</span>
        </Link>
        <Link to="/admin/crear-estudiante">
          <span className="nav-icon">🎓</span>
          <span className="nav-text">Crear Estudiante</span>
        </Link>
        <Link to="/admin/gestion-docentes">
          <span className="nav-icon">✏️</span>
          <span className="nav-text">Modificar Datos Docente</span>
        </Link>
        <Link to="/admin/gestion-alumnos">
          <span className="nav-icon">📖</span>
          <span className="nav-text">Modificar Datos Estudiante</span>
        </Link>

        <h3 className="sidebar-section">Matrículas</h3>
        <Link to="/admin/aprobar-matricula">
          <span className="nav-icon">✅</span>
          <span className="nav-text">Aprobar Matrícula</span>
        </Link>
        <Link to="/admin/rechazar-matricula">
          <span className="nav-icon">❌</span>
          <span className="nav-text">Rechazar Matrícula</span>
        </Link>

        <h3 className="sidebar-section">Asignaciones</h3>

        <Link to="/admin/registrar-asignaciones">
          <span className="nav-icon">🆕</span>
          <span className="nav-text">Registrar Asignaciones</span>
        </Link>

        <Link to="/admin/listar-editar-asignaciones">
          <span className="nav-icon">📋</span>
          <span className="nav-text"> Listar y Editar Asignaciones</span>
        </Link>

        <Link to="/admin/eliminar-asignaciones">
          <span className="nav-icon">🗑️</span>
          <span className="nav-text">Eliminar Asignaciones</span>
        </Link>

        <h3 className="sidebar-section">Infraestructura</h3>
        <Link to="/admin/asignar-aula">
          <span className="nav-icon">🏫</span>
          <span className="nav-text">Asignar Aula</span>
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
