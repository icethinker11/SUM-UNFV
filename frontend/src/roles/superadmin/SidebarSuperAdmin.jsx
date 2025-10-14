import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  UserCog,
  PlusCircle,
  FileText,
  ListChecks,
  // Importamos más íconos si son necesarios (lucide-react ya está incluido)
} from "lucide-react";
import "./styles/sidebar-superadmin.css";

function SidebarSuperAdmin({ usuario }) {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    // Aseguramos que la clase 'active' se aplique al botón de la sección abierta
    const sectionToToggle = openSection === section ? null : section;
    setOpenSection(sectionToToggle);
  };

  const isSectionOpen = (section) => openSection === section;

  return (
    <div className="sidebar-superadmin">
      <h2 className="sidebar-title">👑 SuperAdmin</h2>
      <p className="sidebar-user">Usuario ID: {usuario?.usuario_id || 1}</p>

      <nav className="sidebar-nav">
        <Link to="/superadmin/crear-admin" className="sidebar-link main-link">
          <PlusCircle className="icon" /> Crear Administradores
        </Link>


        {/* 🔹 Sección: Gestión de Usuarios */}
        <div className="sidebar-section">
          <button
            className={`section-toggle ${isSectionOpen("usuarios") ? "active" : ""}`}
            onClick={() => toggleSection("usuarios")}
          >
            <UserCog className="icon" /> Gestión de Usuarios
            {isSectionOpen("usuarios") ? (
              <ChevronDown className="chevron" />
            ) : (
              <ChevronRight className="chevron" />
            )}
          </button>
          {isSectionOpen("usuarios") && (
            <div className="submenu">
              <Link to="/superadmin/gestion-admins" className="submenu-link">
                👨‍💼 Modificar Administrador
              </Link>
            </div>
          )}
        </div>

        {/* 🔹 Sección: Gestión de Cursos */}
        <div className="sidebar-section">
          <button
            className={`section-toggle ${isSectionOpen("cursos") ? "active" : ""}`}
            onClick={() => toggleSection("cursos")}
          >
            <BookOpen className="icon" /> Gestión de Cursos
            {isSectionOpen("cursos") ? (
              <ChevronDown className="chevron" />
            ) : (
              <ChevronRight className="chevron" />
            )}
          </button>
          {isSectionOpen("cursos") && (
            <div className="submenu">
              <Link to="/superadmin/crear-curso" className="submenu-link">
                📝 Registrar Curso
              </Link>
              <Link to="/superadmin/actualizar-curso" className="submenu-link">
                🔄 Actualizar Curso
              </Link>
              <Link to="/superadmin/eliminar-curso" className="submenu-link">
                ❌ Eliminar Curso
              </Link>
              <Link to="/superadmin/consultar-cursos" className="submenu-link">
                🔍 Consultar Curso
              </Link>
            </div>
          )}
        </div>

        {/* 🔹 Sección: Gestión de Prerrequisitos (ACTUALIZADA) */}
        <div className="sidebar-section">
          <button
            className={`section-toggle ${isSectionOpen("prerrequisitos") ? "active" : ""}`}
            onClick={() => toggleSection("prerrequisitos")}
          >
            <ListChecks className="icon" /> Gestión de Prerrequisitos
            {isSectionOpen("prerrequisitos") ? (
              <ChevronDown className="chevron" />
            ) : (
              <ChevronRight className="chevron" />
            )}
          </button>

          {isSectionOpen("prerrequisitos") && (
            <div className="submenu">
              
              {/* 1. Definir (Crear/Guardar) */}
              <Link
                to="/superadmin/definir-prerrequisito"
                className="submenu-link"
              >
                🔗 Definir Prerrequisito
              </Link>
{/* 2. Listar (Ver la tabla) */}
              <Link
                to="/superadmin/listar-prerrequisitos"
                className="submenu-link"
              >
                📋 Listar Prerrequisitos
              </Link>

            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

export default SidebarSuperAdmin;