<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import "../styles/crear-asignaciones.css";

export default function RegistrarAsignaciones() {
  // URL base (usa el prefijo /admin porque tu blueprint se registrará así)
  const API_BASE = "http://localhost:5000/admin";

  // Estados de datos
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [mensaje, setMensaje] = useState("");

  // Formulario
  const [formData, setFormData] = useState({
    curso_id: "",
    seccion_id: "",
    estudiantes: "",
    docente_id: "",
    observaciones: "",
    horario_id: "",
    aula_id: "",
    periodo: "",
  });

  // 🔹 Cargar datos del backend Flask
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, cursoRes, horarioRes, aulaRes, seccionRes] =
          await Promise.all([
            fetch(`${API_BASE}/docentes`),
            fetch(`${API_BASE}/cursos`),
            fetch(`${API_BASE}/horarios`),
            fetch(`${API_BASE}/aulas`),
            fetch(`${API_BASE}/secciones`),
          ]);

        if (
          !docRes.ok ||
          !cursoRes.ok ||
          !horarioRes.ok ||
          !aulaRes.ok ||
          !seccionRes.ok
        )
          throw new Error("Error al cargar datos del servidor");

        const [
          docentesData,
          cursosData,
          horariosData,
          aulasData,
          seccionesData,
        ] = await Promise.all([
          docRes.json(),
          cursoRes.json(),
          horarioRes.json(),
          aulaRes.json(),
          seccionRes.json(),
        ]);

        console.log("✅ Datos cargados correctamente");
        console.log({
          docentesData,
          cursosData,
          horariosData,
          aulasData,
          seccionesData,
        });

        setDocentes(docentesData || []);
        setCursos(cursosData || []);
        setHorarios(horariosData || []);
        setAulas(aulasData || []);
        setSecciones(seccionesData || []);
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        setMensaje("Error al conectar con el backend");
      }
    };

    fetchData();
  }, []);

  // 🔹 Manejar cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await fetch(`${API_BASE}/crear-asignacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "❌ Error al registrar la asignación");
        return;
      }

      setMensaje(data.mensaje || "✅ Asignación creada correctamente");

      // Limpiar formulario
      setFormData({
        curso_id: "",
        seccion_id: "",
        estudiantes: "",
        docente_id: "",
        observaciones: "",
        horario_id: "",
        aula_id: "",
        periodo: "",
      });
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  // 🔹 Renderizado del formulario
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">
        🧩 Nueva Asignación
      </h2>

      <form onSubmit={handleSubmit} className="asignaciones-form">
        {/* ---------------- PASO 1 ---------------- */}
        <h3 className="text-lg font-semibold mb-4">
          Paso 1: Información General
        </h3>

        <div className="form-column">
          {/* Curso */}
          <div>
            <label>Curso *</label>
            <select
              name="curso_id"
              value={formData.curso_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar curso</option>
              {cursos.map((c) => (
                <option key={c.curso_id} value={c.curso_id}>
                  {c.nombre} ({"CICLO:" + c.ciclo}) — {c.codigo}
                </option>
              ))}
            </select>
          </div>

          {/* Sección */}
          <div>
            <label>Sección *</label>
            <select
              name="seccion_codigo"
              value={formData.seccion_codigo || ""}
              onChange={(e) => {
                const codigoSeleccionado = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  seccion_codigo: codigoSeleccionado,
                  seccion_id: "", // resetea
                  periodo: "", // limpia
                }));
              }}
              required
            >
              <option value="">Seleccionar sección</option>
              {["A", "B", "C"].map((letra) => (
                <option key={letra} value={letra}>
                  {letra}
                </option>
              ))}
            </select>
          </div>

          {/* Periodo */}
          <div>
            <label>Periodo *</label>
            <select
              name="seccion_id"
              value={formData.seccion_id}
              onChange={(e) => {
                const seccionSeleccionada = secciones.find(
                  (s) => s.seccion_id === Number(e.target.value)
                );
                setFormData((prev) => ({
                  ...prev,
                  seccion_id: e.target.value,
                  periodo: seccionSeleccionada
                    ? seccionSeleccionada.periodo
                    : "",
                }));
              }}
              required
              disabled={!formData.seccion_codigo}
            >
              <option value="">
                {formData.seccion_codigo
                  ? "Seleccionar periodo"
                  : "Primero selecciona una sección"}
              </option>

              {secciones
                .filter((s) => s.codigo === formData.seccion_codigo)
                .map((s) => (
                  <option key={s.seccion_id} value={s.seccion_id}>
                    {s.periodo} ({s.ciclo_academico})
                  </option>
                ))}
            </select>
          </div>

          {/* Estudiantes */}
          <div>
            <label>Estudiantes *</label>
            <input
              type="number"
              name="estudiantes"
              value={formData.estudiantes}
              onChange={handleChange}
              required
              placeholder="N° de estudiantes"
            />
          </div>

          {/* Docente */}
          <div>
            <label>Docente *</label>
            <select
              name="docente_id"
              value={formData.docente_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar docente</option>
              {Array.isArray(docentes) && docentes.length > 0 ? (
                docentes.map((d) => (
                  <option
                    key={d.docente_id || d.dni}
                    value={d.docente_id || d.dni}
                  >
                    {d.nombres && d.apellidos
                      ? `${d.nombres} ${d.apellidos}`
                      : d.apellidos || "Sin nombre"}{" "}
                    ({d.correo || "Sin correo"})
                  </option>
                ))
              ) : (
                <option disabled>Cargando docentes...</option>
              )}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        {/* ---------------- PASO 2 ---------------- */}
        <h3 className="text-lg font-semibold mt-8 mb-4">
          Paso 2: Horario y Aula
        </h3>

        <div className="form-column">
          {/* Horario */}
          <div>
            <label>Horario *</label>
            <select
              name="horario_id"
              value={formData.horario_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar horario</option>
              {horarios.map((h) => (
                <option key={h.bloque_id} value={h.bloque_id}>
                  {h.codigo_bloque} — {h.descripcion}
                </option>
              ))}
            </select>
          </div>

          {/* Aula */}
          <div>
            <label>Aula *</label>
            <select
              name="aula_id"
              value={formData.aula_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar aula</option>
              {aulas.map((a) => (
                <option key={a.aula_id} value={a.aula_id}>
                  {a.nombre} — Pabellón: {a.pabellon} — Tipo: {a.tipo_aula} —
                  Capacidad: {a.capacidad}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button type="submit" className="btn-submit">
            💾 Registrar Asignación
          </button>
        </div>
      </form>

      {/* Mensaje de estado */}
      {mensaje && (
        <div
          className={`mt-4 text-center font-medium ${
            mensaje.includes("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {mensaje}
        </div>
      )}
    </div>
  );
}
=======
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
>>>>>>> e0799d2705245f3912c6ea738ac97302328a471c
