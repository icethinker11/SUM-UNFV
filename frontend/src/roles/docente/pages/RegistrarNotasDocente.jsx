import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/RegistrarNotasDocente.css";

const RegistrarNotasDocente = () => {
  const docenteId = sessionStorage.getItem("docente_id");
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [notas, setNotas] = useState({}); // Almacena notas nuevas o existentes
  const [cargando, setCargando] = useState(false);

  // --- 1. CARGA INICIAL DE CURSOS ---
  useEffect(() => {
    if (docenteId) {
      axios
        .get(`http://localhost:5000/api/calificaciones/cursos/${docenteId}`)
        .then((res) => setCursos(res.data))
        .catch((err) => console.error("Error al cargar cursos:", err));
    }
  }, [docenteId]);

  // --- 2. CARGA ESTUDIANTES Y NOTAS AL SELECCIONAR CURSO ---
  const seleccionarCurso = (curso) => {
    setCursoSeleccionado(curso);
    setCargando(true);

    // 💡 Paso A: Cargar estudiantes para la asignación
    axios
      .get(
        `http://localhost:5000/api/calificaciones/curso/${curso.asignacion_id}/estudiantes`
      )
      .then((resEstudiantes) => {
        const listaEstudiantes = resEstudiantes.data;
        setEstudiantes(listaEstudiantes);

        // 💡 Paso B: Cargar las calificaciones (requiere nueva ruta o consulta)
        fetchCalificaciones(listaEstudiantes, curso.curso_id);
      })
      .catch((err) => console.error("Error al cargar estudiantes:", err));
  };
  
  // --- FUNCIÓN ADICIONAL: Cargar Notas Guardadas (Simulado o real) ---
  const fetchCalificaciones = (listaEstudiantes, curso_id) => {
    // ⚠️ NOTA: Asumiremos que tu backend tiene una ruta para obtener
    // TODAS las calificaciones de un curso específico.
    // Si no la tienes, esta es la que necesitas crear en Flask/calificaciones_bp.
    
    // Por ahora, usamos una ruta general. Si tu backend solo tiene
    // una ruta para UN estudiante, tendrías que hacer N peticiones, lo cual es ineficiente.
    
    // Suponiendo que tienes una ruta nueva: /api/calificaciones/curso/notas?curso_id=X&docente_id=Y
    axios.get(`http://localhost:5000/api/calificaciones/notas/${curso_id}/${docenteId}`)
      .then(resNotas => {
        const notasGuardadas = resNotas.data; // Esperamos un array de objetos con las notas
        
        // Mapear las notas a un objeto para fácil acceso por estudiante_id
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

  // --- CÁLCULO DE PROMEDIO Y ESTADO ---
  const calcularPromedioEstado = (estudianteId) => {
    const notasEstudiante = notas[estudianteId];
    if (!notasEstudiante) return { promedio: 0, estado: "PENDIENTE" };

    // Convertir a números y filtrar nulos/cero para el promedio
    const n_practicas = parseFloat(notasEstudiante.practicas) || 0;
    const n_parcial = parseFloat(notasEstudiante.parcial) || 0;
    const n_final = parseFloat(notasEstudiante.final) || 0;
    
    const notasValidas = [n_practicas, n_parcial, n_final].filter(n => n > 0);
    
    let promedio = 0;
    if (notasValidas.length > 0) {
        // Fórmula de promedio simple (suma / cantidad de notas)
        promedio = (n_practicas + n_parcial + n_final) / notasValidas.length;
    }
    
    promedio = Math.round(promedio * 100) / 100; // Redondear a 2 decimales
    const estado = promedio >= 11 ? "APROBADO" : "DESAPROBADO";

    return { promedio, estado };
  };

  const handleChange = (id, field, value) => {
    // Convertir a número antes de almacenar para el cálculo de promedio en el frontend
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
      // Se envían las notas como string (el backend las convertirá a número)
      practicas: String(notas[estudiante.estudiante_id]?.practicas || 0),
      parcial: String(notas[estudiante.estudiante_id]?.parcial || 0),
      final: String(notas[estudiante.estudiante_id]?.final || 0),
      // El backend debe calcular el promedio y estado, pero los incluimos si son necesarios
      // promedio: promedio, 
      // estado: estado
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/calificaciones/registrar",
        datos
      );
      alert(res.data.mensaje);
      
      // Actualizar el estado local con el promedio/estado que devuelve el backend
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

  // --- RENDERIZADO ---
  return (
    <div className="notas-container">
      <h2>🧾 Registro de Calificaciones</h2>

      {!cursoSeleccionado ? (
        <div className="cards-container">
          {/* ... (renderizado de cards de cursos) ... */}
          {cursos.length === 0 ? (
            <p>No tienes cursos asignados.</p>
          ) : (
            cursos.map((c) => (
              <div
                key={c.asignacion_id}
                className="curso-card"
                onClick={() => seleccionarCurso(c)}
              >
                <h3>{c.curso}</h3>
                <p>Sección: {c.seccion}</p>
                <p>Ciclo: {c.ciclo}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="tabla-container">
          <button className="volver-btn" onClick={() => setCursoSeleccionado(null)}>
            🔙 Volver a cursos
          </button>
          <h3>
            {cursoSeleccionado.curso} - Sección {cursoSeleccionado.seccion}
          </h3>
          {cargando ? (
              <p>Cargando estudiantes y notas...</p>
          ) : (
            <table className="tabla-notas">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Prácticas</th>
                  <th>Parcial</th>
                  <th>Final</th>
                  <th>Promedio</th> {/* 💡 Nuevo */}
                  <th>Estado</th>    {/* 💡 Nuevo */}
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((e) => {
                    const currentNotas = notas[e.estudiante_id] || {};
                    const { promedio, estado } = calcularPromedioEstado(e.estudiante_id); // Calcula localmente
                    
                    return (
                      <tr key={e.estudiante_id}>
                        <td>{e.nombre_completo}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="20"
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
                            value={currentNotas.final || ""}
                            onChange={(ev) =>
                              handleChange(e.estudiante_id, "final", ev.target.value)
                            }
                          />
                        </td>
                        <td className="promedio">{promedio.toFixed(2)}</td> {/* Muestra el promedio */}
                        <td className={`estado ${estado.toLowerCase()}`}>
                            {estado} {/* Muestra el estado */}
                        </td> 
                        <td>
                          <button onClick={(ev) => guardarNota(ev, e)}>💾 Guardar</button>
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
  );
};

export default RegistrarNotasDocente;