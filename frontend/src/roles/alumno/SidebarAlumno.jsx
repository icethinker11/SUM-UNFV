import { Link } from "react-router-dom";
import "./styles/sidebar-alumno.css";

function SidebarAlumno({ usuario }) {
  return (
    <div className="sidebar-alumno">
      <h2>👨‍🎓 Alumno</h2>
      <p>Usuario ID: {usuario.usuario_id}</p>
      <nav>
        <Link to="/alumno/solicitar-matricula">📝 Solicitar Matrícula</Link>
        <Link to="/alumno/mis-asignaciones">📚 Mis Asignaciones</Link> {/* 👈 NUEVO */}
        <Link to="/alumno/horario">📅 Ver Horario</Link>
        <Link to="/alumno/calificaciones">🧾 Consultar Calificaciones</Link>
        <Link to="/alumno/material">📚 Descargar Material</Link>
      </nav>
    </div>
  );
}

export default SidebarAlumno;
