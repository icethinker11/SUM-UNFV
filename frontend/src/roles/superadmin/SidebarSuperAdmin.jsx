import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  UserCog,
  PlusCircle,
  FileText,
  ListChecks,
  CalendarClock,
  Home,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import "./styles/sidebar-superadmin.css";

function SidebarSuperAdmin({ usuario, onLogout }) {
  const [openSection, setOpenSection] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const toggleSection = (section) => {
    const sectionToToggle = openSection === section ? null : section;
    setOpenSection(sectionToToggle);
  };

  const isSectionOpen = (section) => openSection === section;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
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
              className={`section-toggle ${
                isSectionOpen("usuarios") ? "active" : ""
              }`}
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
              className={`section-toggle ${
                isSectionOpen("cursos") ? "active" : ""
              }`}
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

          {/* 🔹 Sección: Gestión de Horarios */}
          <div className="sidebar-section">
            <button
              className={`section-toggle ${
                isSectionOpen("horarios") ? "active" : ""
              }`}
              onClick={() => toggleSection("horarios")}
            >
              <CalendarClock className="icon" /> Gestión de Horarios
              {isSectionOpen("horarios") ? (
                <ChevronDown className="chevron" />
              ) : (
                <ChevronRight className="chevron" />
              )}
            </button>

            {isSectionOpen("horarios") && (
              <div className="submenu">
                <Link to="/superadmin/registrar-horario" className="submenu-link">
                  📝 Registrar Horario
                </Link>
                <Link to="/superadmin/listar-horario" className="submenu-link">
                  📋 Listar Horarios
                </Link>
                <Link to="/superadmin/editar-horario" className="submenu-link">
                  ✏️ Editar Horario
                </Link>
                <Link to="/superadmin/eliminar-horario" className="submenu-link">
                  🗑️ Eliminar Horario
                </Link>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <Link
              to="/superadmin/Gestion-Aulas"
              className="sidebar-link main-link"
            >
              <Home className="icon" /> Gestión de Aulas
            </Link>
          </div>

          {/* 🔑 CORRECCIÓN: La sección de prerrequisitos ahora es un enlace directo */}
          <Link
            to="/superadmin/listar-prerrequisitos"
            className="sidebar-link main-link"
          >
            <ListChecks className="icon" /> Gestión de Prerrequisitos
          </Link>

          {/* 🔑 NUEVO LIST-CHECK: Secciones disponibles durante el ciclo, tambien para la tabla de auditorias */}
          <Link
            to="/superadmin/gestionar-secciones"
            className="sidebar-link main-link"
          >
            <ListChecks className="icon" /> Gestión de Secciones
          </Link>

          {/* 🔴 BOTÓN DE CERRAR SESIÓN */}
          <button
            onClick={handleLogoutClick}
            className="sidebar-link main-link logout-button"
          >
            <LogOut className="icon" /> Cerrar Sesión
          </button>
        </nav>
      </div>

      {/* 🔔 MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN */}
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-icon">
              <AlertTriangle size={48} color="#f59e0b" />
            </div>
            <h3 className="logout-modal-title">¿Estás seguro de cerrar sesión?</h3>
            <p className="logout-modal-message">
              Si tienes cambios sin guardar, se perderán al cerrar sesión.
            </p>
            <div className="logout-modal-buttons">
              <button onClick={cancelLogout} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={confirmLogout} className="btn-confirm">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SidebarSuperAdmin;