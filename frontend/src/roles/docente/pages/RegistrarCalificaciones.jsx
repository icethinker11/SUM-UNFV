import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Registrar-calificaciones.css"; // 👈 Importamos el CSS personalizado

const API_URL = "http://127.0.0.1:5000/api/docentes";

export default function RegistrarCalificaciones() {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [notas, setNotas] = useState({});
  const [mensaje, setMensaje] = useState("");

  // 🔹 Obtener cursos del docente
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await axios.get(`${API_URL}/cursos`);
        setCursos(res.data);
      } catch (err) {
        console.error("❌ Error al obtener cursos:", err);
      }
    };
    fetchCursos();
  }, []);

  // 🔹 Obtener estudiantes matriculados en el curso seleccionado
  const fetchEstudiantes = async (cursoId) => {
    try {
      const res = await axios.get(`${API_URL}/cursos/${cursoId}/estudiantes`);
      setEstudiantes(res.data);
      const inicial = {};
      res.data.forEach((e) => {
        inicial[e.estudiante_id] = {
          practicas: "",
          parcial: "",
          final: "",
          sustitutorio: "",
          aplazado: "",
          promedio: "",
          estado: "",
        };
      });
      setNotas(inicial);
    } catch (err) {
      console.error("❌ Error al obtener estudiantes:", err);
    }
  };

  // 🔹 Cambiar nota
  const handleNotaChange = (id, campo, valor) => {
    setNotas({
      ...notas,
      [id]: { ...notas[id], [campo]: valor },
    });
  };

  // 🔹 Guardar calificación
  const guardarNotas = async (estudianteId) => {
    try {
      const payload = {
        estudiante_id: estudianteId,
        curso_id: cursoSeleccionado,
        ...notas[estudianteId],
      };

      const res = await axios.post(`${API_URL}/calificaciones`, payload);

      // Actualiza promedio y estado en la tabla
      const { promedio, estado } = res.data;
      setNotas({
        ...notas,
        [estudianteId]: {
          ...notas[estudianteId],
          promedio,
          estado,
        },
      });

      setMensaje(`✅ ${res.data.mensaje}`);
    } catch (err) {
      console.error("❌ Error al guardar calificación:", err);
      setMensaje("❌ Error al registrar la calificación");
    }
  };

  return (
    <div className="calificaciones-container">
      <h2 className="titulo">📘 Registrar Calificaciones</h2>

      {/* Selector de curso */}
      <div className="curso-selector">
        <label>Selecciona un curso:</label>
        <select
          value={cursoSeleccionado}
          onChange={(e) => {
            const id = e.target.value;
            setCursoSeleccionado(id);
            if (id) fetchEstudiantes(id);
          }}
        >
          <option value="">-- Selecciona --</option>
          {cursos.map((curso) => (
            <option key={curso.curso_id} value={curso.curso_id}>
              {curso.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {estudiantes.length > 0 && (
        <div className="tabla-container">
          <table className="tabla-calificaciones">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Prácticas</th>
                <th>Parcial</th>
                <th>Final</th>
                <th>Sustitutorio</th>
                <th>Aplazado</th>
                <th>Promedio</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e) => (
                <tr key={e.estudiante_id}>
                  <td>{e.nombre_completo}</td>
                  {["practicas", "parcial", "final", "sustitutorio", "aplazado"].map((campo) => (
                    <td key={campo}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={notas[e.estudiante_id]?.[campo] || ""}
                        onChange={(ev) =>
                          handleNotaChange(e.estudiante_id, campo, ev.target.value ? parseFloat(ev.target.value) : "")
                        }
                      />
                    </td>
                  ))}
                  <td className="promedio">
                    {notas[e.estudiante_id]?.promedio !== ""
                      ? notas[e.estudiante_id].promedio
                      : "-"}
                  </td>
                  <td
                    className={`estado ${
                      notas[e.estudiante_id]?.estado === "Aprobado" ? "aprobado" : "desaprobado"
                    }`}
                  >
                    {notas[e.estudiante_id]?.estado || "-"}
                  </td>
                  <td>
                    <button onClick={() => guardarNotas(e.estudiante_id)}>💾 Guardar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
}
