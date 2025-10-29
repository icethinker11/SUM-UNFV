import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/gestionar-alumno.css";

function GestionarAlumno() {
  const navigate = useNavigate();
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [formData, setFormData] = useState({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    dni: "",
    telefono: "",
    codigo_universitario: "",
    correo_institucional: "",
    correo_personal: ""
  });

  // Cargar lista de estudiantes
  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/alumnos");
      const data = await response.json();
      
      if (response.ok) {
        setEstudiantes(data.alumnos);
      } else {
        setError("Error al cargar estudiantes");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionarEstudiante = async (estudiante) => {
    try {
      // Obtener detalles completos del estudiante
      const response = await fetch(`http://localhost:5000/admin/alumnos/${estudiante.estudiante_id}`);
      const data = await response.json();

      if (response.ok) {
        // Separar apellidos
        const apellidos = data.apellidos.split(" ");
        const apellido_paterno = apellidos[0] || "";
        const apellido_materno = apellidos.slice(1).join(" ") || "";

        setEstudianteSeleccionado(data);
        setFormData({
          nombres: data.nombres,
          apellido_paterno: apellido_paterno,
          apellido_materno: apellido_materno,
          dni: data.dni,
          telefono: data.telefono,
          codigo_universitario: data.codigo_universitario,
          correo_institucional: data.correo_institucional,
          correo_personal: "" // No se almacena en BD, dejar vacío
        });
        setModoEdicion(false);
        setMensaje("");
        setError("");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar detalles del estudiante");
    }
  };

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

  const handleEditar = () => {
    setModoEdicion(true);
    setMensaje("");
    setError("");
  };

  const handleCancelar = () => {
    setModoEdicion(false);
    // Restaurar datos originales
    if (estudianteSeleccionado) {
      const apellidos = estudianteSeleccionado.apellidos.split(" ");
      setFormData({
        nombres: estudianteSeleccionado.nombres,
        apellido_paterno: apellidos[0] || "",
        apellido_materno: apellidos.slice(1).join(" ") || "",
        dni: estudianteSeleccionado.dni,
        telefono: estudianteSeleccionado.telefono,
        codigo_universitario: estudianteSeleccionado.codigo_universitario,
        correo_institucional: estudianteSeleccionado.correo_institucional,
        correo_personal: ""
      });
    }
    setMensaje("");
    setError("");
  };
  const handleEliminar = async () => {
  try {
    const response = await fetch(
      `http://localhost:5000/admin/alumnos/${estudianteSeleccionado.estudiante_id}`,
      { method: "DELETE" }
    );

    const data = await response.json();

    if (response.ok) {
      setMensaje("Estudiante eliminado correctamente ✅");
      setMostrarModalEliminar(false);
      setEstudianteSeleccionado(null);
      setFormData({
        nombres: "",
        apellido_paterno: "",
        apellido_materno: "",
        dni: "",
        telefono: "",
        codigo_universitario: "",
        correo_institucional: "",
        correo_personal: ""
      });
      
      // Recargar lista
      await cargarEstudiantes();
    } else {
      setError(data.error || "Error al eliminar estudiante");
      setMostrarModalEliminar(false);
    }
  } catch (error) {
    console.error("Error:", error);
    setError("Error de conexión con el servidor");
    setMostrarModalEliminar(false);
  }
  };  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    // Validar correo institucional
    if (!validarCorreoInstitucional(formData.correo_institucional)) {
      setError("El correo institucional debe pertenecer al dominio @alumnounfv.edu.pe");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:5000/admin/alumnos/${estudianteSeleccionado.estudiante_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensaje("Estudiante actualizado correctamente ✅");
        setModoEdicion(false);
        
        // Recargar lista de estudiantes
        await cargarEstudiantes();
        
        // Recargar detalles del estudiante actualizado
        setTimeout(() => {
          handleSeleccionarEstudiante({ estudiante_id: estudianteSeleccionado.estudiante_id });
        }, 1000);
      } else {
        setError(data.error || "Error al actualizar estudiante");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const estudiantesFiltrados = estudiantes.filter(est => {
    const searchTerm = busqueda.toLowerCase();
    return (
      est.nombres.toLowerCase().includes(searchTerm) ||
      est.apellidos.toLowerCase().includes(searchTerm) ||
      est.codigo_universitario.toLowerCase().includes(searchTerm) ||
      est.dni.includes(searchTerm)
    );
  });

  if (cargando) {
    return (
      <div className="gestionar-alumno-container">
        <div className="loading">Cargando estudiantes...</div>
      </div>
    );
  }

  return (
    <div className="gestionar-alumno-container">
      <div className="gestionar-alumno-content">
        <h2>📋 Gestionar Estudiantes</h2>
        <p className="escuela-info">Escuela Profesional de Ingeniería de Sistemas</p>

        <div className="layout-dos-columnas">
          {/* COLUMNA IZQUIERDA: Lista de estudiantes */}
          <div className="columna-lista">
            <div className="busqueda-container">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, apellido, código o DNI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
            </div>

            <div className="lista-estudiantes">
              {estudiantesFiltrados.length === 0 ? (
                <p className="no-resultados">No se encontraron estudiantes</p>
              ) : (
                estudiantesFiltrados.map((estudiante) => (
                  <div
                    key={estudiante.estudiante_id}
                    className={`estudiante-item ${
                      estudianteSeleccionado?.estudiante_id === estudiante.estudiante_id
                        ? "seleccionado"
                        : ""
                    }`}
                    onClick={() => handleSeleccionarEstudiante(estudiante)}
                  >
                    <div className="estudiante-info">
                      <strong>{estudiante.apellidos}, {estudiante.nombres}</strong>
                      <small>Código: {estudiante.codigo_universitario}</small>
                      <small>DNI: {estudiante.dni}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Formulario de edición */}
          <div className="columna-formulario">
            {!estudianteSeleccionado ? (
              <div className="placeholder">
                <p>👈 Selecciona un estudiante de la lista para ver sus detalles</p>
              </div>
            ) : (
              <div className="formulario-edicion">
                <div className="header-formulario">
                  <h3>Detalles del Estudiante</h3>
                  {!modoEdicion && (
                  <div className="botones-accion">
                  <button onClick={handleEditar} className="btn-editar">✏️ Editar</button>
                  <button onClick={() => setMostrarModalEliminar(true)} className="btn-eliminar">🗑️ Eliminar</button>
                  </div>  
                  )}
                </div>

                {mensaje && <div className="alert-success">{mensaje}</div>}
                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nombres *</label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      disabled={!modoEdicion || isSubmitting}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Apellido Paterno *</label>
                      <input
                        type="text"
                        name="apellido_paterno"
                        value={formData.apellido_paterno}
                        onChange={handleChange}
                        disabled={!modoEdicion || isSubmitting}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Apellido Materno *</label>
                      <input
                        type="text"
                        name="apellido_materno"
                        value={formData.apellido_materno}
                        onChange={handleChange}
                        disabled={!modoEdicion || isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>DNI *</label>
                      <input
                        type="text"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        maxLength="8"
                        pattern="[0-9]{8}"
                        disabled={!modoEdicion || isSubmitting}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Código Universitario *</label>
                      <input
                        type="text"
                        name="codigo_universitario"
                        value={formData.codigo_universitario}
                        onChange={handleChange}
                        maxLength="10"
                        disabled={!modoEdicion || isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Correo Institucional *</label>
                    <input
                      type="email"
                      name="correo_institucional"
                      value={formData.correo_institucional}
                      onChange={handleChange}
                      disabled={!modoEdicion || isSubmitting}
                      required
                    />
                    {modoEdicion && formData.correo_institucional && 
                     !validarCorreoInstitucional(formData.correo_institucional) && (
                      <small className="error-hint">
                        ⚠️ El correo debe terminar en @alumnounfv.edu.pe
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Nro. Telefónico *</label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      maxLength="9"
                      pattern="[0-9]{9}"
                      disabled={!modoEdicion || isSubmitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Escuela</label>
                    <input
                      type="text"
                      value="Ingeniería de Sistemas"
                      disabled
                      className="input-disabled"
                    />
                    <small className="info-text">
                      * El estudiante está asociado exclusivamente a Ingeniería de Sistemas
                    </small>
                  </div>

                  {modoEdicion && (
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={handleCancelar}
                        className="btn-cancelar"
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-actualizar"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Actualizando..." : "Actualizar"}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
            {/* Modal de confirmación para eliminar */}
      {mostrarModalEliminar && (
        <div className="modal-overlay" onClick={() => setMostrarModalEliminar(false)}>
          <div className="modal-confirmar" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirmar Eliminación</h3>
            <p>
              ¿Estás seguro de que deseas eliminar al estudiante <strong>{formData.nombres} {formData.apellido_paterno} {formData.apellido_materno}</strong>?
            </p>
            <p className="advertencia">Esta acción desactivará al estudiante del sistema.</p>
            <div className="modal-botones">
              <button onClick={() => setMostrarModalEliminar(false)} className="btn-modal-cancelar">
                Cancelar
              </button>
              <button onClick={handleEliminar} className="btn-confirmar-eliminar">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionarAlumno;