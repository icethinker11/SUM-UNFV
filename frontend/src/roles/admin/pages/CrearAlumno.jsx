import { useState, useEffect } from "react";
import "../styles/crear-alumno.css";

function CrearAlumno() {
  const [formData, setFormData] = useState({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo_institucional: "",
    correo_personal: "",
    dni: "",
    telefono: "",
    codigo_universitario: "",
    ciclo_ingreso: ""
  });

  const [ciclosAcademicos, setCiclosAcademicos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generar ciclos académicos válidos
    const generarCiclos = () => {
      const ciclos = [];
      const añoActual = new Date().getFullYear();
      
      // Generar ciclos desde 2020 hasta el año actual + 1
      for (let año = 2020; año <= añoActual + 1; año++) {
        ciclos.push(`${año}-I`);
        ciclos.push(`${año}-II`);
      }
      
      setCiclosAcademicos(ciclos.reverse()); // Más recientes primero
    };

    generarCiclos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validarCorreoInstitucional = (correo) => {
    return correo.endsWith("@alumnounfv.edu.pe");
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMensaje("");
  setError("");

  // Validar dominio del correo institucional
  if (!validarCorreoInstitucional(formData.correo_institucional)) {
    setError("El correo institucional debe pertenecer al dominio @alumnounfv.edu.pe");
    return;
  }

  // Deshabilitar botón mientras se procesa
  setIsSubmitting(true);

  try {
    const response = await fetch("http://localhost:5000/admin/alumnos/crear-alumno", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        escuela_id: 1 // ID fijo para Escuela de Ingeniería de Sistemas
      })
    });

    const data = await response.json();

    if (response.ok) {
      // 📧 Mensaje mejorado según si se envió el correo o no
      const mensajeExito = data.correo_enviado 
        ? "Estudiante registrado exitosamente ✅\n📧 Se envió un correo con las credenciales al correo personal" 
        : "Estudiante registrado exitosamente ✅\n⚠️ No se pudo enviar el correo (pero el estudiante fue creado)";
      
      setMensaje(mensajeExito);
      
      // Limpiar formulario después de 2 segundos y redirigir
      setTimeout(() => {
        setFormData({
          nombres: "",
          apellido_paterno: "",
          apellido_materno: "",
          correo_institucional: "",
          correo_personal: "",
          dni: "",
          telefono: "",
          codigo_universitario: "",
          ciclo_ingreso: ""
        });
        setIsSubmitting(false);
        // Aquí puedes redirigir a la lista de estudiantes
        // window.location.href = "/admin/estudiantes";
      }, 3000); // Aumenté a 3 segundos para que lean el mensaje
    } else {
      setError(data.error || "Error al registrar estudiante");
      setIsSubmitting(false);
    }
  } catch (error) {
    console.error("Error:", error);
    setError("Error de conexión con el servidor");
    setIsSubmitting(false);
  }
};

  return (
    <div className="crear-alumno-container">
      <div className="crear-alumno-form">
        <h2>🎓 Registrar Estudiante</h2>
        <p className="escuela-info">Escuela Profesional de Ingeniería de Sistemas</p>
        
        {mensaje && <div className="alert-success">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Nombres */}
          <div className="form-group">
            <label>Nombres *</label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              placeholder="Ingrese nombres completos"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Apellidos en fila */}
          <div className="form-row">
            <div className="form-group">
              <label>Apellido Paterno *</label>
              <input
                type="text"
                name="apellido_paterno"
                value={formData.apellido_paterno}
                onChange={handleChange}
                placeholder="Apellido paterno"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Apellido Materno *</label>
              <input
                type="text"
                name="apellido_materno"
                value={formData.apellido_materno}
                onChange={handleChange}
                placeholder="Apellido materno"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* DNI y Código Universitario */}
          <div className="form-row">
            <div className="form-group">
              <label>DNI *</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="8 dígitos"
                maxLength="8"
                pattern="[0-9]{8}"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Código Universitario *</label>
              <input
                type="text"
                name="codigo_universitario"
                value={formData.codigo_universitario}
                onChange={handleChange}
                placeholder="Ej: 2024001234"
                maxLength="10"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Correo Institucional */}
          <div className="form-group">
            <label>Correo Institucional *</label>
            <input
              type="email"
              name="correo_institucional"
              value={formData.correo_institucional}
              onChange={handleChange}
              placeholder="ejemplo@alumnounfv.edu.pe"
              required
              disabled={isSubmitting}
            />
            {formData.correo_institucional && !validarCorreoInstitucional(formData.correo_institucional) && (
              <small className="error-hint">⚠️ El correo debe terminar en @alumnounfv.edu.pe</small>
            )}
          </div>

          {/* Correo Personal */}
          <div className="form-group">
            <label>Correo Personal *</label>
            <input
              type="email"
              name="correo_personal"
              value={formData.correo_personal}
              onChange={handleChange}
              placeholder="correo@gmail.com"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Teléfono y Ciclo de Ingreso */}
          <div className="form-row">
            <div className="form-group">
              <label>Nro. Telefónico *</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="9 dígitos"
                maxLength="9"
                pattern="[0-9]{9}"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Ciclo de Ingreso *</label>
              <select
                name="ciclo_ingreso"
                value={formData.ciclo_ingreso}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccionar ciclo</option>
                {ciclosAcademicos.map(ciclo => (
                  <option key={ciclo} value={ciclo}>
                    {ciclo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearAlumno;