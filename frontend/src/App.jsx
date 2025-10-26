import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ✨ 1. IMPORTACIONES PARA LAS NOTIFICACIONES
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🧩 Login - IMPORTACIONES ACTUALIZADAS
// 1. Importa el componente principal (tu antigua Login.jsx renombrada)
import LoginPrincipal from "./assets/components/LoginPrincipal"; 
// 2. Importa los nuevos formularios de login específicos
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

// 🚨 CORRECCIÓN CLAVE: Usamos el nombre del archivo con el que estás trabajando.
// El nombre del componente dentro del archivo es 'GestionPrerrequisitos', pero importamos el archivo.
import GestionarPrerrequisitos from "./roles/superadmin/pages/GestionarPrerrequisitos";


// 🏫 Páginas Admin
import CrearDocente from "./roles/admin/pages/CrearDocente";
import CrearAlumno from "./roles/admin/pages/CrearAlumno";
import GestionDocentes from "./roles/admin/pages/GestionDocentes";
import GestionAlumnos from "./roles/admin/pages/GestionAlumnos";

// 🧑‍🏫 Páginas Docente
import RegistrarNota from "./roles/docente/pages/RegistrarNota";
import SubirMaterial from "./roles/docente/pages/SubirMaterial";

// 🎓 Páginas Alumno
import SolicitarMatricula from "./roles/alumno/pages/SolicitarMatricula";
import VerHorario from "./roles/alumno/pages/VerHorario";

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
            <Routes>
                {/* 1. RUTA PRINCIPAL (Landing Page con selección de rol) */}
                <Route path="/" element={<LoginPrincipal onLoginSuccess={handleLoginSuccess} />} />

                {/* 2. RUTAS DE FORMULARIOS DE LOGIN ESPECÍFICOS */}
                {/* Nota: En tu LoginPrincipal.jsx, debes navegar a estas rutas al hacer clic en los botones de rol */}
                <Route path="/login/admin" element={<LoginAdmin onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/login/docente" element={<LoginDocente onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/login/alumno" element={<LoginAlumno onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/login/aplicativo" element={<LoginAplicativo onLoginSuccess={handleLoginSuccess} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        );
    }

    // 🔧 Función genérica para renderizar layout según el rol
    const renderRoleLayout = (SidebarComponent, routes, defaultPath) => {
        return (
            <div className="flex">
                <SidebarComponent usuario={user} onLogout={handleLogout} />
                <div className="flex-1 p-6 bg-gray-50 min-h-screen overflow-x-auto">
                    <Routes>
                        {routes}
                        <Route path="*" element={<Navigate to={defaultPath} />} />
                    </Routes>
                </div>
            </div>
        );
    };

    // 🎭 Render según el rol del usuario
    switch (user.rol) {
        case "SuperAdmin":
            return renderRoleLayout(
                SidebarSuperAdmin,
                <>
                    {/* Rutas de cursos y administradores (Manteniendo el Case Sensitive que usas) */}
                    <Route path="/superadmin/Crear-Admin" element={<CrearAdmin />} />
                    <Route path="/superadmin/Gestion-Admins" element={<GestionAdmins />} />
                    <Route path="/superadmin/Crear-Curso" element={<CrearCurso />} />
                    <Route path="/superadmin/Actualizar-Curso" element={<ActualizarCurso />} />
                    <Route path="/superadmin/Eliminar-Curso" element={<EliminarCurso />} />
                    <Route path="/superadmin/Consultar-Cursos" element={<ConsultarCursos />} />
                    <Route path="/superadmin/Configurar-Cursos" element={<ConfigurarCursos />} />

                    {/* 🚨 CORRECCIÓN CLAVE: Rutas unificadas para Gestión de Prerrequisitos */}
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

                    {/* Rutas de superadmin para la gestión de horarios*/}
                    <Route path="/superadmin/registrar-horario" element={<RegistrarHorario />} />
                    <Route path="/superadmin/listar-horario" element={<ListarHorario />} />
                    <Route path="/superadmin/editar-horario" element={<EditarHorario />} />
                    <Route path="/superadmin/eliminar-horario" element={<EliminarHorario/>} />
                   
                    {/* Rutas de superadmin para la gestión de aulas*/}
                    <Route path="/superadmin/Gestion-Aulas" element={<GestionAulas />} />

                </>,
                // Ruta por defecto (ejemplo)
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
                </>,
                "/admin/crear-docente"
            );

        case "Docente":
            return renderRoleLayout(
                SidebarDocente,
                <>
                    <Route path="/docente/registrar-nota" element={<RegistrarNota />} />
                    <Route path="/docente/subir-material" element={<SubirMaterial />} />
                </>,
                "/docente/registrar-nota"
            );

        case "Alumno":
            return renderRoleLayout(
                SidebarAlumno,
                <>
                    <Route path="/alumno/solicitar-matricula" element={<SolicitarMatricula />} />
                    <Route path="/alumno/horario" element={<VerHorario />} />
                </>,
                "/alumno/solicitar-matricula"
            );

        default:
            return <p>Rol desconocido</p>;
    }
}

export default App;