import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/RegistrarNotasDocente.css";

const RegistrarNotasDocente = () => {
  const docenteId = sessionStorage.getItem("docente_id");
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [notas, setNotas] = useState({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (docenteId) {
      axios
        .get(`http://localhost:5000/api/calificaciones/cursos/${docenteId}`)
        .then((res) => setCursos(res.data))
        .catch((err) => console.error("Error al cargar cursos:", err));
    }
  }, [docenteId]);

  const seleccionarCurso = (curso) => {
    setCursoSeleccionado(curso);
    setCargando(true);

    axios
      .get(
        `http://localhost:5000/api/calificaciones/curso/${curso.asignacion_id}/estudiantes`
      )
      .then((resEstudiantes) => {
        const listaEstudiantes = resEstudiantes.data;
        setEstudiantes(listaEstudiantes);
        fetchCalificaciones(listaEstudiantes, curso.curso_id);
      })
      .catch((err) => console.error("Error al cargar estudiantes:", err));
  };
  
  const fetchCalificaciones = (listaEstudiantes, curso_id) => {
    axios.get(`http://localhost:5000/api/calificaciones/notas/${curso_id}/${docenteId}`)
      .then(resNotas => {
        const notasGuardadas = resNotas.data;
        const notasIniciales = {};
        notasGuardadas.forEach(nota => {
          notasIniciales[nota.estudiante_id] = {
            practicas: nota.practicas || "",
            parcial: nota.parcial || "",
            final: nota.final || "",
            promedio: nota.promedio || 0,
            estado: nota.estado || "",
          };
        });
        setNotas(notasIniciales);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al cargar notas guardadas:", err);
        setCargando(false);
      });
  };

  const calcularPromedioEstado = (estudianteId) => {
    const notasEstudiante = notas[estudianteId];
    if (!notasEstudiante) return { promedio: 0, estado: "PENDIENTE" };

    const n_practicas = parseFloat(notasEstudiante.practicas) || 0;
    const n_parcial = parseFloat(notasEstudiante.parcial) || 0;
    const n_final = parseFloat(notasEstudiante.final) || 0;
    
    const notasValidas = [n_practicas, n_parcial, n_final].filter(n => n > 0);
    
    let promedio = 0;
    if (notasValidas.length > 0) {
        promedio = (n_practicas + n_parcial + n_final) / notasValidas.length;
    }
    
    promedio = Math.round(promedio * 100) / 100;
    const estado = promedio >= 11 ? "APROBADO" : "DESAPROBADO";

    return { promedio, estado };
  };

  const handleChange = (id, field, value) => {
    const numericValue = value === "" ? "" : parseFloat(value);
    setNotas((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: numericValue },
    }));
  };

  const guardarNota = async (e, estudiante) => {
    e.preventDefault();
    
    const { promedio, estado } = calcularPromedioEstado(estudiante.estudiante_id);

    const datos = {
      estudiante_id: estudiante.estudiante_id,
      curso_id: cursoSeleccionado.curso_id,
      docente_id: docenteId,
      practicas: String(notas[estudiante.estudiante_id]?.practicas || 0),
      parcial: String(notas[estudiante.estudiante_id]?.parcial || 0),
      final: String(notas[estudiante.estudiante_id]?.final || 0),
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/calificaciones/registrar",
        datos
      );
      alert(res.data.mensaje);
      
      setNotas(prev => ({
          ...prev,
          [estudiante.estudiante_id]: {
              ...prev[estudiante.estudiante_id],
              promedio: res.data.promedio,
              estado: res.data.estado
          }
      }));
      
    } catch (error) {
      console.error("Error al guardar calificación:", error);
      alert("❌ Error al guardar calificación");
    }
  };

  return (
    <div className="notas-container">
      <div className="notas-content">
        
        {/* Header Principal */}
        <div className="notas-header">
          <h2>🧾 Registro de Calificaciones</h2>
          <p>Selecciona un curso para gestionar las calificaciones de los estudiantes</p>
        </div>

        {!cursoSeleccionado ? (
          <div className="cursos-grid">
            {cursos.length === 0 ? (
              <div className="estado-vacio">
                <div className="icono-vacio">📚</div>
                <p>No tienes cursos asignados</p>
              </div>
            ) : (
              cursos.map((c) => (
                <div
                  key={c.asignacion_id}
                  className="curso-card"
                  onClick={() => seleccionarCurso(c)}
                >
                  <div className="curso-card-header">
                    <h3>{c.curso}</h3>
                  </div>
                  <div className="curso-card-body">
                    <div className="curso-info">
                      <span className="info-label">Sección:</span>
                      <span className="info-value">{c.seccion}</span>
                    </div>
                    <div className="curso-info">
                      <span className="info-label">Ciclo:</span>
                      <span className="info-value">{c.ciclo}</span>
                    </div>
                    
                  </div>
                  <div className="curso-card-footer">
                    <button className="btn-seleccionar">
                      Gestionar Notas →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="tabla-container">
            <div className="tabla-header">
              <div>
                <h3>{cursoSeleccionado.curso} - Sección {cursoSeleccionado.seccion}</h3>
                <p style={{color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.875rem'}}>
                  Ciclo {cursoSeleccionado.ciclo} • Código: {cursoSeleccionado.codigo_curso}
                </p>
              </div>
              <button className="btn-volver" onClick={() => setCursoSeleccionado(null)}>
                ← Volver a cursos
              </button>
            </div>

            {cargando ? (
              <div className="estado-carga">
                <p>Cargando estudiantes y notas...</p>
              </div>
            ) : (
              <table className="tabla-notas">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Prácticas</th>
                    <th>Parcial</th>
                    <th>Final</th>
                    <th>Promedio</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((e) => {
                      const currentNotas = notas[e.estudiante_id] || {};
                      const { promedio, estado } = calcularPromedioEstado(e.estudiante_id);
                      
                      return (
                        <tr key={e.estudiante_id}>
                          <td>{e.nombre_completo}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.1"
                              className="nota-input"
                              value={currentNotas.practicas || ""}
                              onChange={(ev) =>
                                handleChange(e.estudiante_id, "practicas", ev.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.1"
                              className="nota-input"
                              value={currentNotas.parcial || ""}
                              onChange={(ev) =>
                                handleChange(e.estudiante_id, "parcial", ev.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.1"
                              className="nota-input"
                              value={currentNotas.final || ""}
                              onChange={(ev) =>
                                handleChange(e.estudiante_id, "final", ev.target.value)
                              }
                            />
                          </td>
                          <td className="promedio">{promedio.toFixed(2)}</td>
                          <td>
                            <span className={`estado ${estado.toLowerCase()}`}>
                              {estado}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn-guardar" 
                              onClick={(ev) => guardarNota(ev, e)}
                            >
                              💾 Guardar
                            </button>
                          </td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrarNotasDocente;