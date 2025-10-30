import { useState, useEffect } from "react";
import "../styles/crear-docente.css"; 
import { FaChalkboardTeacher } from 'react-icons/fa';

/**
 * Hook personalizado para simplificar la carga de datos (Ubigeo, Escuelas).
 */
function useFetch(url) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (url) {
      fetch(url)
        .then(res => res.json())
        .then(data => {
          // Extrae el primer array que encuentre en la respuesta (ej: data.departamentos)
          setData(data[Object.keys(data)[0]] || []);
        })
        .catch(err => {
          console.error("Error en useFetch:", err);
          setData([]);
        });
    } else {
      setData([]);
    }
  }, [url]);
  return data;
}

function CrearDocente() {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    contrasena: "",
    dni: "",
    telefono: "",
    escuela_id: "",
    fecha_nacimiento: "",
    direccion_desc: "", // Mapeado a 'direccion_detalle' en el backend
    id_distrito: ""      
  });

  const [selectedDepa, setSelectedDepa] = useState("");
  const [selectedProvi, setSelectedProvi] = useState("");

  const escuelas = useFetch("http://127.0.0.1:5000/admin/escuelas");
  const departamentos = useFetch("http://127.0.0.1:5000/admin/departamentos");
  const provincias = useFetch(selectedDepa ? `http://127.0.0.1:5000/admin/provincias/${selectedDepa}` : null);
  const distritos = useFetch(selectedProvi ? `http://127.0.0.1:5000/admin/distritos/${selectedProvi}` : null);
  
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDepaChange = (e) => {
    setSelectedDepa(e.target.value);
    setSelectedProvi(""); 
    setFormData(f => ({ ...f, id_distrito: "" })); 
  };

  const handleProviChange = (e) => {
    setSelectedProvi(e.target.value);
    setFormData(f => ({ ...f, id_distrito: "" })); 
  };
  
  const handleDistriChange = (e) => {
    handleChange(e); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:5000/admin/crear-docente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData) 
      });

      const data = await response.json();
      if (response.ok) {
        setMensaje(data.mensaje);
        setFormData({
          nombres: "", apellidos: "", correo: "", contrasena: "",
          dni: "", telefono: "", escuela_id: "", fecha_nacimiento: "",
          direccion_desc: "", id_distrito: ""
        });
        setSelectedDepa("");
        setSelectedProvi("");
      } else {
        setError(data.error || "Error al crear docente");
      }
    } catch (error) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="crear-docente-container">
      <div className="crear-docente-form">
        <h2 className="form-title">
          <FaChalkboardTeacher /> Registrar Docente
        </h2>
        
        {mensaje && <div className="alert-success">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* ... (inputs de Nombres, Apellidos, Correo, etc.) ... */}
          <div className="form-group"><input type="text" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Nombres" required /></div>
          <div className="form-group"><input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Apellidos" required /></div>
          <div className="form-group"><input type="text" name="dni" value={formData.dni} onChange={handleChange} placeholder="DNI (8 dígitos)" required pattern="\d{8}" title="El DNI debe tener 8 dígitos." /></div>
          <div className="form-group"><input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono (9 dígitos)" required pattern="\d{9}" title="El teléfono debe tener 9 dígitos." /></div>
          <div className="form-group"><input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required /></div>
          <div className="form-group"><input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="Correo @docenteunfv.edu.pe" required /></div>
          <div className="form-group"><input type="password" name="contrasena" value={formData.contrasena} onChange={handleChange} placeholder="Contraseña" required /></div>

          {/* --- SECCIÓN DE DIRECCIÓN CORREGIDA --- */}
          <div className="form-group">
            <select value={selectedDepa} onChange={handleDepaChange} required>
              <option value="">Seleccionar Departamento</option>
              {/* CORRECCIÓN: depa.departamento_id y depa.nombre_departamento */}
              {departamentos.map(depa => (
                <option key={depa.departamento_id} value={depa.departamento_id}>
                  {depa.nombre_departamento}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <select value={selectedProvi} onChange={handleProviChange} disabled={!selectedDepa} required>
              <option value="">Seleccionar Provincia</option>
              {/* CORRECCIÓN: provi.provincia_id y provi.nombre_provincia */}
              {provincias.map(provi => (
                <option key={provi.provincia_id} value={provi.provincia_id}>
                  {provi.nombre_provincia}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <select name="id_distrito" value={formData.id_distrito} onChange={handleChange} disabled={!selectedProvi} required>
              <option value="">Seleccionar Distrito</option>
              {/* CORRECCIÓN: distri.distrito_id y distri.nombre_distrito */}
              {distritos.map(distri => (
                <option key={distri.distrito_id} value={distri.distrito_id}>
                  {distri.nombre_distrito}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <input
              type="text"
              name="direccion_desc" // Mapeado a 'direccion_detalle' en el backend
              value={formData.direccion_desc}
              onChange={handleChange}
              placeholder="Dirección (Calle, Av, Jr., Lote, etc.)"
              required
            />
          </div>
          {/* --- FIN DE SECCIÓN DE DIRECCIÓN --- */}

          <div className="form-group">
            <select name="escuela_id" value={formData.escuela_id} onChange={handleChange} required>
              <option value="">Seleccionar Escuela</option>
              {escuelas.map(escuela => (
                <option key={escuela.escuela_id} value={escuela.escuela_id}>
                  {escuela.nombre_escuela} - {escuela.facultad}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn-submit">
            Guardar Docente
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearDocente;