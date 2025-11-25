import React, { useEffect, useState } from "react";
import "../styles/eliminar-asignaciones.css";

export default function EliminarAsignaciones() {
  const API_BASE = "http://localhost:5000/admin";

  const [asignaciones, setAsignaciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [asignacionEliminar, setAsignacionEliminar] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [asigRes, docRes, cursoRes, horarioRes, aulaRes, seccionRes] =
        await Promise.all([
          fetch(`${API_BASE}/listar-asignaciones`),
          fetch(`${API_BASE}/docentes`),
          fetch(`${API_BASE}/cursos`),
          fetch(`${API_BASE}/horarios`),
          fetch(`${API_BASE}/aulas`),
          fetch(`${API_BASE}/secciones`),
        ]);

      if (!asigRes.ok || !docRes.ok || !cursoRes.ok || !horarioRes.ok || !aulaRes.ok || !seccionRes.ok) {
        throw new Error("Error al cargar datos del servidor");
      }

      const [asignacionesData, docentesData, cursosData, horariosData, aulasData, seccionesData] =
        await Promise.all([
          asigRes.json(),
          docRes.json(),
          cursoRes.json(),
          horarioRes.json(),
          aulaRes.json(),
          seccionRes.json(),
        ]);

      setAsignaciones(asignacionesData || []);
      setDocentes(docentesData || []);
      setCursos(cursosData || []);
      setHorarios(horariosData || []);
      setAulas(aulasData || []);
      setSecciones(seccionesData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setMensaje("Error al conectar con el backend");
      setMensajeTipo("error");
      setLoading(false);
    }
  };

  const abrirModalEliminar = (asig) => {
    setAsignacionEliminar(asig);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setAsignacionEliminar(null);
  };

  const confirmarEliminacion = async () => {
    try {
      const res = await fetch(`${API_BASE}/eliminar-asignacion/${asignacionEliminar.asignacion_id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "Error al eliminar la asignación");
        setMensajeTipo("error");
        return;
      }

      setMensaje("✅ Asignación eliminada correctamente");
      setMensajeTipo("success");
      cerrarModal();
      cargarDatos();

      setTimeout(() => {
        setMensaje("");
        setMensajeTipo("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setMensaje("Error de conexión con el servidor");
      setMensajeTipo("error");
    }
  };

  const getNombreCurso = (cursoId) => {
    const curso = cursos.find((c) => c.curso_id === cursoId);
    return curso ? `${curso.nombre} (${curso.codigo})` : "N/A";
  };

  const getNombreDocente = (docenteId) => {
    const docente = docentes.find((d) => d.docente_id === docenteId);
    if (!docente) return "N/A";
    return docente.nombre_completo || 
           (docente.nombres && docente.apellidos ? `${docente.nombres} ${docente.apellidos}` : "N/A");
  };

  const getSeccion = (seccionId) => {
    const seccion = secciones.find((s) => s.seccion_id === seccionId);
    return seccion ? `${seccion.codigo} - ${seccion.periodo}` : "N/A";
  };

  const getHorario = (bloqueId) => {
    const horario = horarios.find((h) => h.bloque_id === bloqueId);
    return horario ? horario.descripcion : "N/A";
  };

  const getAula = (aulaId) => {
    const aula = aulas.find((a) => a.aula_id === aulaId);
    return aula ? `${aula.nombre} - ${aula.pabellon}` : "N/A";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Cargando asignaciones...</div>
      </div>
    );
  }

  return (
    <div className="asignaciones-wrapper">
      <div className="asignaciones-header">
        <h2 className="page-title page-title-delete">
          <span className="icon">🗑️</span> Eliminar Asignaciones
        </h2>
        <p className="page-subtitle">Gestiona y elimina asignaciones del sistema</p>
      </div>

      {mensaje && (
        <div className={`alert ${mensajeTipo === "success" ? "alert-success" : "alert-error"}`}>
          {mensaje}
        </div>
      )}

      {asignaciones.length === 0 ? (
        <div className="empty-state">
          <p>No hay asignaciones registradas</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>CURSO</th>
                <th>SECCIÓN</th>
                <th>DOCENTE</th>
                <th>ESTUDIANTES</th>
                <th>HORARIO</th>
                <th>AULA</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((asig) => (
                <tr key={asig.asignacion_id}>
                  <td>{asig.asignacion_id}</td>
                  <td>{getNombreCurso(asig.curso_id)}</td>
                  <td>{getSeccion(asig.seccion_id)}</td>
                  <td>{getNombreDocente(asig.docente_id)}</td>
                  <td className="text-center">{asig.cantidad_estudiantes}</td>
                  <td>{getHorario(asig.bloque_id)}</td>
                  <td>{getAula(asig.aula_id)}</td>
                  <td>
                    <span className={`badge ${asig.observaciones ? "badge-warning" : "badge-success"}`}>
                      {asig.observaciones ? "CON OBSERVACIONES" : "ACTIVO"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => abrirModalEliminar(asig)}
                      className="btn-action btn-delete"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {mostrarModal && asignacionEliminar && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>

            <h3 className="modal-title-delete">¿Estás seguro?</h3>
            <p className="modal-description">
              Esta acción eliminará permanentemente la asignación:
            </p>

            <div className="delete-info">
              <p><strong>Curso:</strong> {getNombreCurso(asignacionEliminar.curso_id)}</p>
              <p><strong>Docente:</strong> {getNombreDocente(asignacionEliminar.docente_id)}</p>
              <p><strong>Sección:</strong> {getSeccion(asignacionEliminar.seccion_id)}</p>
            </div>

            <div className="modal-actions">
              <button onClick={cerrarModal} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={confirmarEliminacion} className="btn-danger">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}