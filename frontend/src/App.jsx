import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ✨ 1. IMPORTACIONES PARA LAS NOTIFICACIONES
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 🧩 Login - IMPORTACIONES ACTUALIZADAS
import LoginPrincipal from "./assets/components/LoginPrincipal";
import LoginAdmin from "./assets/components/LoginAdmin";
import LoginDocente from "./assets/components/LoginDocente";
import LoginAlumno from "./assets/components/LoginAlumno";
import LoginAplicativo from "./assets/components/LoginAplicativo";

// 🧭 Sidebars
import SidebarSuperAdmin from "./roles/superadmin/SidebarSuperAdmin";
import SidebarAdmin from "./roles/admin/SidebarAdmin";
import SidebarDocente from "./roles/docente/SidebarDocente";
import SidebarAlumno from "./roles/alumno/SidebarAlumno";

// 🧑‍💼 Páginas SuperAdmin
import CrearAdmin from "./roles/superadmin/pages/CrearAdmin";
import GestionAdmins from "./roles/superadmin/pages/GestionAdmins";
import CrearCurso from "./roles/superadmin/pages/CrearCurso";
import ActualizarCurso from "./roles/superadmin/pages/ActualizarCurso";
import EliminarCurso from "./roles/superadmin/pages/EliminarCurso";
import ConsultarCursos from "./roles/superadmin/pages/ConsultarCursos";
import ConfigurarCursos from "./roles/superadmin/pages/ConfigurarCursos";
import RegistrarHorario from "./roles/superadmin/pages/RegistrarHorario";
import EditarHorario from "./roles/superadmin/pages/EditarHorario";
import ListarHorario from "./roles/superadmin/pages/ListarHorario";
import EliminarHorario from "./roles/superadmin/pages/EliminarHorario";
import GestionAulas from "./roles/superadmin/pages/GestionAulas";
import GestionarPrerrequisitos from "./roles/superadmin/pages/GestionarPrerrequisitos";
import GestionSecciones from "./roles/superadmin/pages/GestionSecciones";

// 🏫 Páginas Admin
import CrearDocente from "./roles/admin/pages/CrearDocente";
import CrearAlumno from "./roles/admin/pages/CrearAlumno";
import GestionDocentes from "./roles/admin/pages/GestionDocentes";
import GestionAlumnos from "./roles/admin/pages/GestionarAlumnos"; // 🆕 NUEVO -> ASIGNACIONES (cambios huanca)
import PerfilAdmin from "./roles/admin/pages/PerfilAdmin";
import RegistrarAsignaciones from "./roles/admin/pages/RegistrarAsignaciones"; // 🆕 NUEVO -> ASIGNACIONES
import ListneditAsignaciones from "./roles/admin/pages/ListneditAsignaciones"; // 🆕 NUEVO -> ASIGNACIONES
import EliminarAsignaciones from "./roles/admin/pages/EliminarAsignaciones"; // 🆕 NUEVO -> ASIGNACIONES

// 🧑‍🏫 Páginas Docente
import RegistrarNotasDocente from "./roles/docente/pages/RegistrarNotasDocente";
import SubirMaterial from "./roles/docente/pages/SubirMaterial";
import PerfilDocente from "./roles/docente/pages/PerfilDocente";
import CalendarioDocente from "./roles/docente/pages/CalendarioDocente";
import TomarAsistencia from "./roles/docente/pages/TomarAsistencia";

// 🎓 Páginas Alumno
import SolicitarMatricula from "./roles/alumno/pages/SolicitarMatricula";
import VerHorario from "./roles/alumno/pages/VerHorario";
import VerMisAsignaciones from "./roles/alumno/pages/VerMisAsignaciones";
import MatriculaAlumno from "./roles/alumno/pages/MatriculaAlumno";
import VerMisCalificaciones from "./roles/alumno/pages/VerMisCalificaciones";

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (data) => {
    setUser(data);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // 🔐 Si no está logueado, DEBE RENDERIZAR RUTAS PÚBLICAS
  if (!user) {
    return (
      <>
        <Routes>
          <Route
            path="/"
            element={<LoginPrincipal onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/login/admin"
            element={<LoginAdmin onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/login/docente"
            element={<LoginDocente onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/login/alumno"
            element={<LoginAlumno onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/login/aplicativo"
            element={<LoginAplicativo onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {/* 🆕 ToastContainer para notificaciones globales */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </>
    );
  }

  // 🔧 Función genérica para renderizar layout según el rol
  const renderRoleLayout = (SidebarComponent, routes, defaultPath) => {
    return (
      <>
        <div className="flex">
          <SidebarComponent usuario={user} onLogout={handleLogout} />
          <div className="flex-1 p-6 bg-gray-50 min-h-screen overflow-x-auto">
            <Routes>
              {routes}
              <Route path="*" element={<Navigate to={defaultPath} />} />
            </Routes>
          </div>
        </div>
        {/* 🆕 ToastContainer para notificaciones globales */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </>
    );
  };

  // 🎭 Render según el rol del usuario
  switch (user.rol) {
    case "SuperAdmin":
      return renderRoleLayout(
        SidebarSuperAdmin,
        <>
          <Route path="/superadmin/Crear-Admin" element={<CrearAdmin />} />
          <Route
            path="/superadmin/Gestion-Admins"
            element={<GestionAdmins />}
          />
          <Route path="/superadmin/Crear-Curso" element={<CrearCurso />} />
          <Route
            path="/superadmin/Actualizar-Curso"
            element={<ActualizarCurso />}
          />
          <Route
            path="/superadmin/Eliminar-Curso"
            element={<EliminarCurso />}
          />
          <Route
            path="/superadmin/Consultar-Cursos"
            element={<ConsultarCursos />}
          />
          <Route
            path="/superadmin/Configurar-Cursos"
            element={<ConfigurarCursos />}
          />

          <Route
            path="/superadmin/definir-prerrequisito"
            element={<GestionarPrerrequisitos />}
          />
          <Route
            path="/superadmin/listar-prerrequisitos"
            element={<GestionarPrerrequisitos />}
          />
          <Route
            path="/superadmin/eliminar-prerrequisito"
            element={<GestionarPrerrequisitos />}
          />

          <Route
            path="/superadmin/registrar-horario"
            element={<RegistrarHorario />}
          />
          <Route
            path="/superadmin/listar-horario"
            element={<ListarHorario />}
          />
          <Route
            path="/superadmin/editar-horario"
            element={<EditarHorario />}
          />
          <Route
            path="/superadmin/eliminar-horario"
            element={<EliminarHorario />}
          />
          <Route
            path="/superadmin/gestionar-secciones"
            element={<GestionSecciones />}
          />

          <Route path="/superadmin/Gestion-Aulas" element={<GestionAulas />} />
        </>,
        "/superadmin/Crear-Admin"
      );

    case "Admin":
      return renderRoleLayout(
        SidebarAdmin,
        <>
          <Route path="/admin/crear-docente" element={<CrearDocente />} />
          <Route path="/admin/crear-estudiante" element={<CrearAlumno />} />
          <Route path="/admin/gestion-docentes" element={<GestionDocentes />} />
          <Route path="/admin/gestion-alumnos" element={<GestionAlumnos />} />

          {/* 🆕 NUEVA RUTA: Registrar Asignaciones*/}
          <Route
            path="/admin/registrar-asignaciones"
            element={<RegistrarAsignaciones />}
          />

          {/* 🆕 NUEVA RUTA: Listar y editar Asignaciones*/}
          <Route
            path="/admin/listar-editar-asignaciones"
            element={<ListneditAsignaciones />}
          />

          {/* 🆕 NUEVA RUTA: Eliminar Asignaciones*/}
          <Route
            path="/admin/eliminar-asignaciones"
            element={<EliminarAsignaciones />}
          />

          {/* 🆕 NUEVA RUTA: Mi Perfil del Administrador */}
          <Route
            path="/admin/mi-perfil"
            element={<PerfilAdmin usuarioId={user.usuario_id} />}
          />
        </>,
        "/admin/mi-perfil"
      );

    case "Docente":
      return renderRoleLayout(
        SidebarDocente,
        <>
          <Route
            path="/docente/perfil"
            element={<PerfilDocente usuarioId={user.usuario_id} />}
          />

          {/* 🔹 Pasa el docente_id correctamente al componente */}
          <Route
            path="/docente/registrar-nota"
            element={<RegistrarNotasDocente docenteId={user.usuario_id} />}
          />
          {/* 🔹 Subir Material */}
          <Route
            path="/docente/subir-material"
            element={<SubirMaterial docenteId={user.usuario_id} />}
          />
          {/* Asistencia*/}
          <Route path="/docente/asistencia" element={<TomarAsistencia />} />

          {/* 🔹 NUEVO — Calendario del docente */}
          <Route
            path="/docente/calendario"
            element={<CalendarioDocente usuarioId={user.usuario_id} />}
          />
        </>,
        "/docente/perfil" // 🧭 Ruta por defecto al iniciar sesión
      );

    case "Alumno":
      return renderRoleLayout(
        SidebarAlumno,
        <>
          <Route
            path="/alumno/mis-asignaciones"
            element={<VerMisAsignaciones usuario={user} />}
          />
          <Route
            path="/alumno/solicitar-matricula"
            element={<MatriculaAlumno usuario={user} />}
          />
          <Route
            path="/alumno/mi-horario"
            element={<VerHorario estudianteId={user.estudiante_id} />}
          />
          <Route
            path="/alumno/mis-calificaciones"
            element={<VerMisCalificaciones estudianteId={user.estudiante_id} />}
          />
        </>,
        "/alumno/solicitar-matricula"
      );

    default:
      return <p>Rol desconocido</p>;
  }
}

export default App;
