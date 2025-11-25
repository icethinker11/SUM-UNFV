import React, { useEffect, useState } from "react";
import "../styles/listar-editar-asignaciones.css";

export default function ListneditAsignaciones() {
  const API_BASE = "http://localhost:5000/admin";

  const [asignaciones, setAsignaciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");

  const [formEdit, setFormEdit] = useState({
    curso_id: "",
    seccion_id: "",
    estudiantes: "",
    docente_id: "",
    observaciones: "",
    horario_id: "",
    aula_id: "",
  });

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

      if (
        !asigRes.ok ||
        !docRes.ok ||
        !cursoRes.ok ||
        !horarioRes.ok ||
        !aulaRes.ok ||
        !seccionRes.ok
      ) {
        throw new Error("Error al cargar datos del servidor");
      }

      const [
        asignacionesData,
        docentesData,
        cursosData,
        horariosData,
        aulasData,
        seccionesData,
      ] = await Promise.all([
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

  const abrirModalEditar = (asignacion) => {
    setAsignacionEditando(asignacion.asignacion_id);
    setFormEdit({
      curso_id: asignacion.curso_id,
      seccion_id: asignacion.seccion_id,
      estudiantes: asignacion.cantidad_estudiantes,
      docente_id: asignacion.docente_id,
      observaciones: asignacion.observaciones || "",
      horario_id: asignacion.bloque_id,
      aula_id: asignacion.aula_id,
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setAsignacionEditando(null);
    setFormEdit({
      curso_id: "",
      seccion_id: "",
      estudiantes: "",
      docente_id: "",
      observaciones: "",
      horario_id: "",
      aula_id: "",
    });
  };

  const handleChangeEdit = (e) => {
    const { name, value } = e.target;
    setFormEdit((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${API_BASE}/editar-asignacion/${asignacionEditando}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formEdit),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "Error al actualizar la asignación");
        setMensajeTipo("error");
        return;
      }

      setMensaje("✅ Asignación actualizada correctamente");
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
    return (
      docente.nombre_completo ||
      (docente.nombres && docente.apellidos
        ? `${docente.nombres} ${docente.apellidos}`
        : "N/A")
    );
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
        <h2 className="page-title-edit">Listar y Editar Asignaciones</h2>
        <p className="page-subtitle">
          Administra las asignaciones del centro educativo
        </p>
      </div>

      {mensaje && (
        <div
          className={`alert ${
            mensajeTipo === "success" ? "alert-success" : "alert-error"
          }`}
        >
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
                    <span className="badge badge-success">ACTIVO</span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => abrirModalEditar(asig)}
                      className="btn-action btn-edit"
                      title="Editar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div
            className="modal-content modal-edit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-edit">
              <h3 className="modal-title-edit">Editar Asignación</h3>
              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="modal-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Nombre del Curso *</label>
                  <select
                    name="curso_id"
                    value={formEdit.curso_id}
                    onChange={handleChangeEdit}
                    required
                  >
                    {cursos.map((c) => (
                      <option key={c.curso_id} value={c.curso_id}>
                        {c.nombre} ({c.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Capacidad *</label>
                  <input
                    type="number"
                    name="estudiantes"
                    value={formEdit.estudiantes}
                    onChange={handleChangeEdit}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Tipo de Aula *</label>
                  <select
                    name="aula_id"
                    value={formEdit.aula_id}
                    onChange={handleChangeEdit}
                    required
                  >
                    {aulas.map((a) => (
                      <option key={a.aula_id} value={a.aula_id}>
                        {a.nombre} - {a.pabellon}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Pabellón *</label>
                  <select
                    name="seccion_id"
                    value={formEdit.seccion_id}
                    onChange={handleChangeEdit}
                    required
                  >
                    {secciones.map((s) => (
                      <option key={s.seccion_id} value={s.seccion_id}>
                        {s.codigo} - {s.periodo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Docente *</label>
                  <select
                    name="docente_id"
                    value={formEdit.docente_id}
                    onChange={handleChangeEdit}
                    required
                  >
                    {docentes.map((d) => (
                      <option key={d.docente_id} value={d.docente_id}>
                        {d.nombre_completo || `${d.nombres} ${d.apellidos}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Estado *</label>
                  <select
                    name="horario_id"
                    value={formEdit.horario_id}
                    onChange={handleChangeEdit}
                    required
                  >
                    {horarios.map((h) => (
                      <option key={h.bloque_id} value={h.bloque_id}>
                        {h.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
