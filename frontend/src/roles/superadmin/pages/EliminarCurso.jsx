import { useEffect, useState } from "react";
import "../styles/eliminar-curso.css";

export default function EliminarCurso() {
  const [cursos, setCursos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [confirmar, setConfirmar] = useState(null);

  // 🔹 Cargar la lista de cursos al montar el componente
  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      const res = await fetch("http://localhost:5000/curso/");
      const data = await res.json();
      setCursos(data);
    } catch (error) {
      console.error("Error al cargar cursos:", error);
      setMensaje("❌ Error al obtener los cursos.");
    }
  };

  const eliminarCurso = async (cursoId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/curso/eliminar/${cursoId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMensaje("✅ Curso eliminado correctamente.");
        setCursos(cursos.filter((c) => c.curso_id !== cursoId));
      } else {
        setMensaje("⚠️ " + data.error);
      }
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error al eliminar el curso.");
    } finally {
      setConfirmar(null);
    }
  };

  const confirmarEliminacion = (curso) => {
    setConfirmar(curso);
  };

  return (
    <div className="eliminar-curso">
      <h2>🗑️ Eliminar Curso de la Malla Curricular</h2>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      {confirmar ? (
        <div className="confirmacion">
          <p>
            ¿Seguro que deseas eliminar el curso{" "}
            <strong>{confirmar.nombre}</strong>?
          </p>
          <div className="botones">
            <button
              onClick={() => eliminarCurso(confirmar.curso_id)}
              className="btn-eliminar"
            >
              Sí, eliminar
            </button>
            <button onClick={() => setConfirmar(null)} className="btn-cancelar">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <table className="tabla-cursos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Créditos</th>
              <th>Ciclo</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cursos.length > 0 ? (
              cursos.map((curso) => (
                <tr key={curso.curso_id}>
                  <td>{curso.codigo}</td>
                  <td>{curso.nombre}</td>
                  <td>{curso.creditos}</td>
                  <td>{curso.ciclo}</td>
                  <td>
                    <button
                      onClick={() => confirmarEliminacion(curso)}
                      className="btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No hay cursos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
