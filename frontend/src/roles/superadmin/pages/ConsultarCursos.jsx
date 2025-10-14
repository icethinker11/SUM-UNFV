import { useEffect, useState } from "react";
import "../styles/consultar-cursos.css";

export default function ConsultarCursos() {
  const [cursos, setCursos] = useState([]);
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const obtenerCursos = async (ciclo = "") => {
    try {
      const url = ciclo
        ? `http://localhost:5000/curso/listar?ciclo=${ciclo}`
        : "http://localhost:5000/curso/listar";

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setCursos(data);
        setMensaje(
          data.length
            ? ""
            : "⚠️ No se encontraron cursos para el ciclo seleccionado."
        );
      } else {
        setMensaje("❌ Error al obtener los cursos.");
      }
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error de conexión con el servidor.");
    }
  };

  useEffect(() => {
    obtenerCursos(); // carga inicial
  }, []);

  const handleFiltro = (e) => {
    const cicloSeleccionado = e.target.value;
    setFiltroCiclo(cicloSeleccionado);
    obtenerCursos(cicloSeleccionado);
  };

  return (
    <div className="consultar-cursos">
      <h2>📚 Consultar Malla Curricular</h2>

      <div className="filtros">
        <label>
          Filtrar por ciclo:
          <select value={filtroCiclo} onChange={handleFiltro}>
            <option value="">Todos los ciclos</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
            <option value="V">V</option>
            <option value="VI">VI</option>
            <option value="VII">VII</option>
            <option value="VIII">VIII</option>
            <option value="IX">IX</option>
            <option value="X">X</option>
          </select>
        </label>
      </div>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <table className="tabla-cursos">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Créditos</th>
            <th>Ciclo</th>
            <th>Horas Teóricas</th>
            <th>Horas Prácticas</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((curso) => (
            <tr key={curso.curso_id}>
              <td>{curso.codigo}</td>
              <td>{curso.nombre}</td>
              <td>{curso.creditos}</td>
              <td>{curso.ciclo}</td>
              <td>{curso.horas_teoricas}</td>
              <td>{curso.horas_practicas}</td>
              <td>{curso.estado ? "Activo" : "Inactivo"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
