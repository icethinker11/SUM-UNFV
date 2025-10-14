import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../styles/crear-admin.css";

const BASE_URL = "http://localhost:5000/superadmin";

function CrearAdmin() {
  // ESTADO PRINCIPAL (Todos los campos del formulario)
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    correo_personal: "",
    dni: "",
    telefono: "",
    direccion_detalle: "",
    distrito_id: "",
    fecha_nacimiento: "",
    id_formacion: "",
    id_especialidad: "",
    escuela_id: "",
    experiencia_lab: "",
  });

  // ESTADOS DE DATOS AUXILIARES Y JERARQUÍA DE UBICACIÓN
  const [escuelas, setEscuelas] = useState([]);
  const [formaciones, setFormaciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // 1. LÓGICA DE CARGA INICIAL Y JERARQUÍA GEOGRÁFICA
  // ==========================================================
  // CrearAdmin.jsx (Reemplaza el bloque useCallback completo)

  const cargarDatosAuxiliares = useCallback(async () => {
    try {
      // 🔑 CRÍTICO: Usamos AXIOS para todas las llamadas iniciales
      // Axios devuelve el JSON directamente en .data
      const [resDptos, resEscuelas, resFormaciones, resEspecialidades] =
        await Promise.all([
          axios.get(`${BASE_URL}/departamentos-geo`),
          axios.get(`${BASE_URL}/escuelas`),
          axios.get(`${BASE_URL}/formaciones`),
          axios.get(`${BASE_URL}/especialidades`),
        ]);

      // NOTA: No necesitamos .json(), ya que Axios lo hizo. Accedemos a .data
      setDepartamentos(resDptos.data.departamentos || []);
      setEscuelas(resEscuelas.data.escuelas || []);
      setFormaciones(resFormaciones.data.formaciones || []);
      setEspecialidades(resEspecialidades.data.especialidades || []);

      setError("");
    } catch (err) {
      console.error("❌ Error al cargar datos iniciales (AXIOS):", err);
      // Si hay un error, el mensaje viene en la respuesta del servidor o es un error de red.
      setError(
        err.response?.data?.error || "Error al cargar datos auxiliares."
      );
    }
  }, []);

  useEffect(() => {
    cargarDatosAuxiliares();
  }, [cargarDatosAuxiliares]);

  // Cargar PROVINCIAS (usa axios)
  useEffect(() => {
    setProvincias([]);
    setProvinciaSeleccionada("");
    setDistritos([]);
    setFormData((prev) => ({ ...prev, distrito_id: "" }));
    if (departamentoSeleccionado) {
      axios
        .get(`${BASE_URL}/provincias/${departamentoSeleccionado}`)
        .then((res) => setProvincias(res.data.provincias || []))
        .catch((err) => console.error("Error cargando provincias", err));
    }
  }, [departamentoSeleccionado]);

  // Cargar DISTRITOS (usa axios)
  useEffect(() => {
    setDistritos([]);
    setFormData((prev) => ({ ...prev, distrito_id: "" }));
    if (provinciaSeleccionada) {
      axios
        .get(`${BASE_URL}/distritos/${provinciaSeleccionada}`)
        .then((res) => setDistritos(res.data.distritos || []))
        .catch((err) => console.error("Error cargando distritos", err));
    }
  }, [provinciaSeleccionada]);

  // ==========================================================
  // 2. MANEJO DE ESTADO Y SUBMIT
  // ==========================================================
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!formData.distrito_id) {
      return setError(
        "Por favor, complete la selección de ubicación hasta el Distrito."
      );
    }

    try {
      const response = await fetch(`${BASE_URL}/crear-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje || "Administrador creado correctamente ✅");
        // Reset del formulario después del éxito
        setFormData({
          nombres: "",
          apellidos: "",
          correo_personal: "",
          dni: "",
          telefono: "",
          direccion_detalle: "",
          distrito_id: "",
          fecha_nacimiento: "",
          id_formacion: "",
          id_especialidad: "",
          escuela_id: "",
          experiencia_lab: "",
        });
        setDepartamentoSeleccionado("");
        setProvinciaSeleccionada("");
      } else {
        setError(data.error || "Error al crear administrador");
      }
    } catch (err) {
      console.error("❌ Error de conexión:", err);
      setError("Error de conexión con el servidor");
    }
  };

  // ==========================================================
  // 3. RENDERIZADO DEL FORMULARIO (JSX)
  // ==========================================================
  return (
    <div className="crear-admin-container">
      <div className="crear-admin-card">
        <h2>Registrar Administrador</h2>
        {mensaje && <div className="alert success">{mensaje}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* DATOS PERSONALES */}
          <h3>🧍 Datos Personales</h3>
          <div className="form-row">
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              placeholder="Nombres"
              required
            />
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Apellidos"
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="DNI (8 dígitos)"
              required
            />
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              required
            />
          </div>

          {/* CONTACTO */}
          <h3>📞 Contacto</h3>
          <div className="form-row">
            <input
              type="email"
              name="correo_personal"
              value={formData.correo_personal}
              onChange={handleChange}
              placeholder="Correo personal"
              required
            />
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Teléfono (9 dígitos)"
              required
            />
          </div>

          {/* UBICACIÓN (JERÁRQUICA) */}
          <h3>📍 Ubicación</h3>
          <div className="form-row">
            {/* 1. SELECT DEPARTAMENTO */}
            <select
              value={departamentoSeleccionado}
              onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
              required
            >
              <option value="">Seleccione departamento</option>
              {departamentos.map((d) => (
                <option key={d.departamento_id} value={d.departamento_id}>
                  {d.nombre_departamento}
                </option>
              ))}
            </select>

            {/* 2. SELECT PROVINCIA */}
            <select
              value={provinciaSeleccionada}
              onChange={(e) => setProvinciaSeleccionada(e.target.value)}
              required
              disabled={!departamentoSeleccionado}
            >
              <option value="">Seleccione provincia</option>
              {provincias.map((p) => (
                <option key={p.provincia_id} value={p.provincia_id}>
                  {p.nombre_provincia}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            {/* 3. SELECT DISTRITO (Guarda el ID final) */}
            <select
              name="distrito_id"
              value={formData.distrito_id}
              onChange={handleChange}
              required
              disabled={!provinciaSeleccionada}
            >
              <option value="">Seleccione distrito</option>
              {distritos.map((d) => (
                <option key={d.distrito_id} value={d.distrito_id}>
                  {d.nombre_distrito}
                </option>
              ))}
            </select>

            {/* Dirección detallada */}
            <input
              type="text"
              name="direccion_detalle"
              value={formData.direccion_detalle}
              onChange={handleChange}
              placeholder="Dirección detallada (Ej: Av. Arequipa 1234)"
            />
          </div>

          {/* INFORMACIÓN PROFESIONAL */}
          <h3>🎓 Información Profesional</h3>
          <div className="form-row">
            <select
              name="id_formacion"
              value={formData.id_formacion}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione formación</option>
              {formaciones.map((f) => (
                <option key={f.id_formacion} value={f.id_formacion}>
                  {f.nombre_formacion}
                </option>
              ))}
            </select>

            <select
              name="id_especialidad"
              value={formData.id_especialidad}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione cargo</option>
              {especialidades.map((e) => (
                <option key={e.id_especialidad} value={e.id_especialidad}>
                  {e.nombre_especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <input
              type="text"
              name="experiencia_lab"
              value={formData.experiencia_lab}
              onChange={handleChange}
              placeholder="Tiempo - Experiencia laboral"
            />
            <div></div>
          </div>

          {/* DATOS INSTITUCIONALES */}
          <h3>🏫 Datos Institucionales</h3>
          <select
            name="escuela_id"
            value={formData.escuela_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione escuela</option>
            {escuelas.map((escuela) => (
              <option key={escuela.escuela_id} value={escuela.escuela_id}>
                {escuela.nombre_escuela}
              </option>
            ))}
          </select>

          {/* BOTÓN */}
          <button type="submit" className="btn-submit">
            💾 Guardar Administrador
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearAdmin;
