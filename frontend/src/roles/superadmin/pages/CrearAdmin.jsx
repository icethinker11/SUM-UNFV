import { useEffect, useState } from "react";
import "../styles/crear-admin.css";

function CrearAdmin() {
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
    id_especialidad: "", // cargo ahora se maneja como id_especialidad
    escuela_id: "",
    experiencia_lab: ""
  });

  const [escuelas, setEscuelas] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [formaciones, setFormaciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // ==========================
  // 🔹 Cargar datos del backend
  // ==========================
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resEscuelas, resDistritos, resFormaciones, resEspecialidades] =
          await Promise.all([
            fetch("http://localhost:5000/superadmin/escuelas"),
            fetch("http://localhost:5000/superadmin/distritos"),
            fetch("http://localhost:5000/superadmin/formaciones"),
            fetch("http://localhost:5000/superadmin/especialidades")
          ]);

        if (!resEscuelas.ok || !resDistritos.ok || !resFormaciones.ok || !resEspecialidades.ok) {
          throw new Error("Error al cargar datos desde el servidor");
        }

        const dataEscuelas = await resEscuelas.json();
        const dataDistritos = await resDistritos.json();
        const dataFormaciones = await resFormaciones.json();
        const dataEspecialidades = await resEspecialidades.json();

        setEscuelas(dataEscuelas.escuelas || []);
        setDistritos(dataDistritos.distritos || []);
        setFormaciones(dataFormaciones.formaciones || []);
        setEspecialidades(dataEspecialidades.especialidades || []);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
        setError("Error al cargar escuelas, distritos, formaciones o especialidades");
      }
    };

    cargarDatos();
  }, []);

  // ==========================
  // 🔹 Manejar cambios en inputs
  // ==========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ==========================
  // 🔹 Enviar formulario
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const response = await fetch("http://localhost:5000/superadmin/crear-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje || "Administrador creado correctamente");
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
          experiencia_lab: ""
        });
      } else {
        setError(data.error || "Error al crear administrador");
      }
    } catch (err) {
      console.error("❌ Error de conexión:", err);
      setError("Error de conexión con el servidor");
    }
  };

  // ==========================
  // 🔹 Renderizado del formulario
  // ==========================
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

          {/* UBICACIÓN */}
          <h3>📍 Ubicación</h3>
          <div className="form-row">
            <select
              name="distrito_id"
              value={formData.distrito_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione distrito</option>
              {distritos.map((d) => (
                <option key={d.distrito_id} value={d.distrito_id}>
                  {d.nombre_distrito}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="direccion_detalle"
              value={formData.direccion_detalle}
              onChange={handleChange}
              placeholder="Dirección detallada (Ej: Av. Arequipa 1234)"
            />
          </div>

          {/* FORMACIÓN Y ESPECIALIDAD */}
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

          {/* EXPERIENCIA LABORAL */}
          <div className="form-row">
            <input
              type="text"
              name="experiencia_lab"
              value={formData.experiencia_lab}
              onChange={handleChange}
              placeholder="Tiempo - Experiencia laboral"
            />
          </div>

          {/* ESCUELA */}
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
