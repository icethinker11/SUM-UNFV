import { useEffect, useState } from "react";
import "../styles/registrar-asignaciones.css";

function RegistrarAsignaciones() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [aulasDisponibles, setAulasDisponibles] = useState([]);
  const [formData, setFormData] = useState({
    curso_id: "",
    seccion_id: "",
    cantidad_estudiantes: "",
    docente_id: "",
    periodo: "",
    observaciones: "",
    horario_id: "",
    aula_id: "",
  });
  const [mensaje, setMensaje] = useState("");

  // ===========================================================
  // CARGAR DATOS INICIALES
  // ===========================================================
  useEffect(() => {
    fetch("http://localhost:5000/superadmin/cursos")
      .then((res) => res.json())
      .then(setCursos);

    fetch("http://localhost:5000/superadmin/secciones/secciones")
      .then((res) => res.json())
      .then(setSecciones);

    fetch("http://localhost:5000/superadmin/docentes")
      .then((res) => res.json())
      .then(setDocentes);

    fetch("http://localhost:5000/superadmin/horarios")
      .then((res) => res.json())
      .then(setHorarios);

    fetchAsignaciones();
  }, []);

  const fetchAsignaciones = () => {
    fetch("http://localhost:5000/superadmin/asignaciones")
      .then((res) => res.json())
      .then(setAsignaciones);
  };

  // ===========================================================
  // MANEJAR CAMBIOS EN EL FORMULARIO
  // ===========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "horario_id") {
      validarAulasDisponibles(value);
    }
  };

  // ===========================================================
  // VALIDAR AULAS DISPONIBLES SEGÚN HORARIO
  // ===========================================================
  const validarAulasDisponibles = (horarioId) => {
    fetch(`http://localhost:5000/superadmin/aulas/disponibles/${horarioId}`)
      .then((res) => res.json())
      .then((data) => setAulasDisponibles(data))
      .catch(() => setAulasDisponibles([]));
  };

  // ===========================================================
  // ENVIAR FORMULARIO
  // ===========================================================
  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:5000/superadmin/asignaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        setMensaje(data.message || "Asignación registrada correctamente ✅");
        fetchAsignaciones();
        setFormData({
          curso_id: "",
          seccion_id: "",
          cantidad_estudiantes: "",
          docente_id: "",
          periodo: "",
          observaciones: "",
          horario_id: "",
          aula_id: "",
        });
      })
      .catch(() => setMensaje("❌ Error al registrar la asignación"));
  };

  return (
    <div className="registrar-asignaciones">
      <h2>Registrar Asignaciones</h2>

      <form className="form-asignacion" onSubmit={handleSubmit}>
        <div className="campo">
          <label>Curso:</label>
          <select
            name="curso_id"
            value={formData.curso_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione</option>
            {cursos.map((c) => (
              <option key={c.id_curso} value={c.id_curso}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Sección:</label>
          <select
            name="seccion_id"
            value={formData.seccion_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione</option>
            {secciones.map((s) => (
              <option key={s.id_seccion} value={s.id_seccion}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Cantidad de estudiantes:</label>
          <input
            type="number"
            name="cantidad_estudiantes"
            value={formData.cantidad_estudiantes}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="campo">
          <label>Docente:</label>
          <select
            name="docente_id"
            value={formData.docente_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione</option>
            {docentes.map((d) => (
              <option key={d.id_docente} value={d.id_docente}>
                {d.nombres} {d.apellidos}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Periodo:</label>
          <select
            name="periodo"
            value={formData.periodo}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione</option>
            <option value="2025-I">2025-I</option>
            <option value="2025-II">2025-II</option>
            <option value="2026-I">2026-I</option>
            <option value="2026-II">2026-II</option>
          </select>
        </div>

        <div className="campo">
          <label>Observaciones:</label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Notas adicionales..."
          />
        </div>

        <div className="campo">
          <label>Horario:</label>
          <select
            name="horario_id"
            value={formData.horario_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione</option>
            {horarios.map((h) => (
              <option key={h.id_horario} value={h.id_horario}>
                {h.dia} {h.hora_inicio} - {h.hora_fin}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Aula:</label>
          <select
            name="aula_id"
            value={formData.aula_id}
            onChange={handleChange}
            disabled={!formData.horario_id || aulasDisponibles.length === 0}
            required
          >
            <option value="">Seleccione</option>
            {aulasDisponibles.map((a) => (
              <option key={a.id_aula} value={a.id_aula}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">Registrar Asignación</button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <h3>📋 Asignaciones Registradas</h3>
      <table className="tabla-asignaciones">
        <thead>
          <tr>
            <th>Curso</th>
            <th>Sección</th>
            <th>Docente</th>
            <th>Periodo</th>
            <th>Estudiantes</th>
            <th>Horario</th>
            <th>Aula</th>
          </tr>
        </thead>
        <tbody>
          {asignaciones.map((a, i) => (
            <tr key={i}>
              <td>{a.curso_nombre}</td>
              <td>{a.seccion_nombre}</td>
              <td>{a.docente_nombre}</td>
              <td>{a.periodo}</td>
              <td>{a.cantidad_estudiantes}</td>
              <td>{a.horario_detalle}</td>
              <td>{a.aula_nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RegistrarAsignaciones;