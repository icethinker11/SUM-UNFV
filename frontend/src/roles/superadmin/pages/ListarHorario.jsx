import { useEffect, useState } from "react";
import "../styles/listar-horario.css";

export default function ListarHorarios() {
  const [bloques, setBloques] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [filtroDia, setFiltroDia] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  // ✅ Cargar horarios desde el backend
  useEffect(() => {
    const fetchBloques = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/superadmin/bloques-horarios-listar"
        );
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

  // ✅ Filtros combinados
  const bloquesFiltrados = bloques.filter((b) => {
    const coincideBusqueda =
      b.codigo_bloque.toLowerCase().includes(busqueda.toLowerCase()) ||
      b.dia.toLowerCase().includes(busqueda.toLowerCase()) ||
      `${b.hora_inicio} - ${b.hora_fin}`.includes(busqueda);

    const coincideDia = filtroDia === "Todos" || b.dia === filtroDia;
    const coincideEstado =
      filtroEstado === "Todos" || b.estado === filtroEstado;

    return coincideBusqueda && coincideDia && coincideEstado;
  });

  return (
    <div className="listar-horarios">
      <h2>📋 Listado de Bloques Horarios</h2>

      {/* 🔎 Filtros */}
      <div className="barra-filtros">
        <input
          type="text"
          placeholder="Buscar por código, día u horario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          value={filtroDia}
          onChange={(e) => setFiltroDia(e.target.value)}
        >
          <option value="Todos">Todos los días</option>
          <option value="Lunes">Lunes</option>
          <option value="Martes">Martes</option>
          <option value="Miércoles">Miércoles</option>
          <option value="Jueves">Jueves</option>
          <option value="Viernes">Viernes</option>
          <option value="Sábado">Sábado</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      {/* 🧾 Tabla */}
      <table className="tabla-horarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Código</th>
            <th>Día</th>
            <th>Horario</th>
            <th>Duración</th>
            <th>Turno</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {bloquesFiltrados.length > 0 ? (
            bloquesFiltrados.map((b) => {
              const [h1, m1] = b.hora_inicio.split(":").map(Number);
              const [h2, m2] = b.hora_fin.split(":").map(Number);
              const totalMin = h2 * 60 + m2 - (h1 * 60 + m1);
              const horas = Math.floor(totalMin / 60);
              const minutos = totalMin % 60;
              const duracion =
                totalMin > 0
                  ? horas > 0
                    ? `${horas}h ${minutos > 0 ? minutos + "m" : ""}`
                    : `${minutos}m`
                  : "⛔ Inválido";
              const turno = h1 < 12 ? "Mañana" : h1 < 19 ? "Tarde" : "Noche";

              return (
                <tr key={b.bloque_id}>
                  <td>{b.bloque_id}</td>
                  <td>{b.codigo_bloque}</td>
                  <td>{b.dia}</td>
                  <td>
                    {b.hora_inicio} - {b.hora_fin}
                  </td>
                  <td>{duracion}</td>
                  <td>
                    <span className={`badge turno-${turno.toLowerCase()}`}>
                      {turno}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`estado-badge ${
                        b.estado === "Activo" ? "activo" : "inactivo"
                      }`}
                    >
                      {b.estado}
                    </span>
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
