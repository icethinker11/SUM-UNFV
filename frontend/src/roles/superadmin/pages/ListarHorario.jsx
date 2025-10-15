import { useEffect, useState } from "react";
import "../styles/registrar-horario.css";

export default function ListarHorarios() {
  const [bloques, setBloques] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  // ✅ Cargar horarios al iniciar
  useEffect(() => {
    const fetchBloques = async () => {
      try {
        const res = await fetch("http://localhost:5000/superadmin/bloques-horarios");
        const data = await res.json();

        if (res.ok) {
          setBloques(data);
        } else {
          setMensaje("⚠️ Error al obtener los horarios.");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        setMensaje("❌ Error al conectar con la API.");
      }
    };
    fetchBloques();
  }, []);

  // ✅ Filtrar por estado
  const bloquesFiltrados =
    filtroEstado === "Todos"
      ? bloques
      : bloques.filter((b) => b.estado === filtroEstado);

  return (
    <div className="registrar-horario">
      <h2>📋 Listado de Bloques Horarios</h2>

      <div className="filtros">
        <label>
          Filtrar por Estado:
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </label>
      </div>

      <table className="tabla-horarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Día</th>
            <th>Hora Inicio</th>
            <th>Hora Fin</th>
            <th>Duración</th>
            <th>Turno</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {bloquesFiltrados.length > 0 ? (
            bloquesFiltrados.map((b) => {
              // Calcular duración y turno al vuelo
              const [h1, m1] = b.hora_inicio.split(":").map(Number);
              const [h2, m2] = b.hora_fin.split(":").map(Number);
              const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
              const horas = Math.floor(totalMin / 60);
              const minutos = totalMin % 60;
              const duracion =
                totalMin > 0
                  ? horas > 0
                    ? `${horas}h ${minutos > 0 ? minutos + "m" : ""}`
                    : `${minutos}m`
                  : "⛔ Inválido";
              const turno =
                h1 < 12 ? "Mañana" : h1 < 18 ? "Tarde" : "Noche";

              return (
                <tr key={b.id_bloque}>
                  <td>{b.id_bloque}</td>
                  <td>{b.dia}</td>
                  <td>{b.hora_inicio}</td>
                  <td>{b.hora_fin}</td>
                  <td>{duracion}</td>
                  <td>{turno}</td>
                  <td
                    className={
                      b.estado === "Activo" ? "estado-activo" : "estado-inactivo"
                    }
                  >
                    {b.estado}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7">No hay bloques registrados.</td>
            </tr>
          )}
        </tbody>
      </table>

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
}
