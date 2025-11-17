import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/matricula-alumno.css";

function MatriculaAlumno({ usuario }) {
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [misCursos, setMisCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cicloCalculado, setCicloCalculado] = useState(null);

  const alumnoId = usuario?.usuario_id;
  const API_URL = "http://127.0.0.1:5000/alumno";

  // ==============================
  // 🔄 Cargar datos
  // ==============================
  const cargarDatos = async () => {
    if (!alumnoId) return;
    try {
      setLoading(true);
      const [disp, matric] = await Promise.all([
        axios.get(`${API_URL}/asignaciones-disponibles/${alumnoId}`),
        axios.get(`${API_URL}/mis-matriculas/${alumnoId}`),
      ]);

      setCicloCalculado(disp.data.ciclo_actual_estudiante || "N/A");
      setCursosDisponibles(disp.data.asignaciones || []);
      setMisCursos(matric.data || []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      toast.error("❌ Error al cargar los datos del alumno.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [alumnoId]);

  // ==============================
  // 🧾 Matricular
  // ==============================
  const handleMatricula = async (asignacionId) => {
    try {
      const res = await axios.post(`${API_URL}/matricular`, {
        alumno_id: alumnoId,
        asignacion_id: asignacionId,
      });
      toast.success(res.data.mensaje || "✅ Matrícula registrada con éxito");
      await cargarDatos();
    } catch (err) {
      console.error("Error al matricular:", err);
      toast.error(err.response?.data?.error || "❌ Error al matricularse");
    }
  };

  // ==============================
  // 🧾 Desmatricular
  // ==============================
  const handleDesmatricular = async (matriculaId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta matrícula?")) return;
    try {
      const res = await axios.delete(`${API_URL}/desmatricular/${matriculaId}`);
      toast.success(res.data.mensaje || "✅ Matrícula eliminada con éxito");
      await cargarDatos();
    } catch (err) {
      console.error("Error al desmatricular:", err);
      toast.error(err.response?.data?.error || "❌ Error al eliminar matrícula");
    }
  };

  // ==============================
  // 🧩 Agrupar por ciclo
  // ==============================
  const agruparPorCiclo = (lista) => {
    const grupos = {};
    lista.forEach((curso) => {
      const ciclo = curso.ciclo || curso.ciclo_curso || "Sin ciclo";
      if (!grupos[ciclo]) grupos[ciclo] = [];
      grupos[ciclo].push(curso);
    });
    return grupos;
  };

  const cursosPorCiclo = agruparPorCiclo(cursosDisponibles);
  const misCursosPorCiclo = agruparPorCiclo(misCursos);

  // ==============================
  // ⏳ Render
  // ==============================
  if (loading) {
    return <p className="loading">Cargando tus cursos y matrículas...</p>;
  }

  return (
    <div className="matricula-container">
      <ToastContainer />
      <h1 className="titulo-seccion">📝 Solicitud de Matrícula</h1>

      {/* ===================== */}
      {/* Cursos Disponibles */}
      {/* ===================== */}
      <section className="seccion">
        <h2>
          Cursos Disponibles — Ciclo Actual:{" "}
          <span className="ciclo">{cicloCalculado || "N/A"}</span>
        </h2>

        {Object.keys(cursosPorCiclo).length === 0 ? (
          <p className="vacio">No hay cursos disponibles para tu ciclo actual.</p>
        ) : (
          Object.entries(cursosPorCiclo).map(([ciclo, cursos]) => (
            <div key={ciclo} className="bloque-ciclo">
              <h3 className="titulo-ciclo">📘 Ciclo {ciclo}</h3>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Sección</th>
                    <th>Horario</th>
                    <th>Aula</th>
                    <th>Docente</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((curso) => (
                    <tr key={curso.asignacion_id}>
                      <td>{curso.nombre_curso}</td>
                      <td>{curso.seccion}</td>
                      <td>
                        {curso.dia} {curso.hora_inicio} - {curso.hora_fin}
                      </td>
                      <td>{curso.aula}</td>
                      <td>{curso.docente}</td>
                      <td>
                        <button
                          className="btn-matricular"
                          onClick={() => handleMatricula(curso.asignacion_id)}
                        >
                          Matricularme
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {/* ===================== */}
      {/* Mis Cursos Matriculados */}
      {/* ===================== */}
      <section className="seccion">
        <h2>Mis Cursos Matriculados</h2>
        {Object.keys(misCursosPorCiclo).length === 0 ? (
          <p className="vacio">Aún no te has matriculado en ningún curso.</p>
        ) : (
          Object.entries(misCursosPorCiclo).map(([ciclo, cursos]) => (
            <div key={ciclo} className="bloque-ciclo">
              <h3 className="titulo-ciclo">🎓 Ciclo {ciclo}</h3>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Sección</th>
                    <th>Horario</th>
                    <th>Aula</th>
                    <th>Docente</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((curso) => (
                    <tr key={curso.matricula_id}>
                      <td>{curso.curso}</td>
                      <td>{curso.seccion}</td>
                      <td>
                        {curso.dia} {curso.hora_inicio} - {curso.hora_fin}
                      </td>
                      <td>{curso.aula}</td>
                      <td>{curso.docente}</td>
                      <td>{curso.estado || "ACTIVA"}</td>
                      <td>
                        <button
                          className="btn-eliminar"
                          onClick={() => handleDesmatricular(curso.matricula_id)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default MatriculaAlumno;
