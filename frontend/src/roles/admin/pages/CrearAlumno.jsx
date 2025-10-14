import { useState, useEffect } from "react";
import "../styles/crear-alumno.css";

function CrearAlumno() {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    contrasena: "",
    dni: "",
    telefono: "",
    codigo_universitario: "",
    escuela_id: ""
  });

  const [escuelas, setEscuelas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarEscuelas = async () => {
      try {
        const response = await fetch("http://localhost:5000/admin/escuelas");
        const data = await response.json();
        if (response.ok) {
          setEscuelas(data.escuelas);
        } else {
          setError("Error al cargar escuelas");
        }
      } catch (error) {
        console.error("Error al cargar escuelas:", error);
        setError("Error de conexión al cargar escuelas");
      }
    };
    cargarEscuelas();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const response = await fetch("http://localhost:5000/admin/crear-alumno", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje);
        setFormData({
          nombres: "",
          apellidos: "",
          correo: "",
          contrasena: "",
          dni: "",
          telefono: "",
          codigo_universitario: "",
          escuela_id: ""
        });
      } else {
        setError(data.error || "Error al crear alumno");
      }
    } catch (error) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="crear-alumno-container">
      <div className="crear-alumno-form">
        <h2>🎓 Registrar Alumno</h2>
        
        {mensaje && <div className="alert-success">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              placeholder="Nombres"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Apellidos"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="Correo @unfv.edu.pe"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="DNI"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="codigo_universitario"
              value={formData.codigo_universitario}
              onChange={handleChange}
              placeholder="Código Universitario"
              required
            />
          </div>

          <div className="form-group">
            <select
              name="escuela_id"
              value={formData.escuela_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar Escuela</option>
              {escuelas.map(escuela => (
                <option key={escuela.escuela_id} value={escuela.escuela_id}>
                  {escuela.nombre_escuela} - {escuela.facultad}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn-submit">
            Guardar Alumno
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearAlumno;