import React, { useState, useEffect } from "react";
import "../styles/eliminar-horario.css";

const EliminarHorario = () => {
  const [horarios, setHorarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const API_URL_LISTAR = "http://localhost:5000/superadmin/bloques-horarios-listar";
  const API_URL_ELIMINAR = "http://localhost:5000/superadmin/bloques-horarios";

  useEffect(() => {
    const obtenerHorarios = async () => {
      try {
        const respuesta = await fetch(API_URL_LISTAR);
        if (!respuesta.ok) throw new Error("Error al obtener horarios");
        const data = await respuesta.json();
        setHorarios(data);
      } catch (error) {
        console.error("❌ Error al obtener horarios:", error);
      }
    };
    obtenerHorarios();
  }, []);

  const eliminarHorario = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este horario?")) {
      try {
        const resp = await fetch(`${API_URL_ELIMINAR}/${id}`, { method: "DELETE" });
        if (!resp.ok) {
          const error = await resp.json();
          throw new Error(error.error || "Error al eliminar horario");
        }
        setHorarios(horarios.filter((h) => h.bloque_id !== id));
        alert("✅ Horario eliminado correctamente");
      } catch (error) {
        console.error("❌ Error al eliminar horario:", error);
        alert("❌ " + error.message);
      }
    }
  };

  const horariosFiltrados = horarios.filter(
    (h) =>
      h.codigo_bloque.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.dia.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.estado.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="main-content">
      <div className="encabezado-eliminar">
        <h1>🗑️ Eliminar Horario</h1>
        <p>Gestiona la eliminación de horarios que ya no estén activos</p>
        <hr />
      </div>

      <div className="busqueda-eliminar">
        <span className="icono-buscar">🔍</span>
        <input
          type="text"
          placeholder="Buscar por código, día o estado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {horariosFiltrados.length === 0 ? (
        <p>No hay horarios registrados.</p>
      ) : (
        <div className="grid-cursos">
          {horariosFiltrados.map((h) => (
            <div key={h.bloque_id} className="tarjeta-curso">
              <div className="header-curso">
                <span className="codigo">{h.codigo_bloque}</span>
                <span className="ciclo">{h.dia}</span>
              </div>
              <h3 className="nombre-curso">
                {h.hora_inicio} - {h.hora_fin}
              </h3>
              <p>Estado: <strong>{h.estado}</strong></p>
              <p>Turno: {h.turno || (parseInt(h.hora_inicio.split(":")[0]) < 12 ? "Mañana" : "Tarde")}</p>

              <button
                className="boton-eliminar"
                onClick={() => eliminarHorario(h.bloque_id)}
              >
                🗑️ Eliminar Horario
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EliminarHorario;

