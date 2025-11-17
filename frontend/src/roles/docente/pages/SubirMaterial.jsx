import React, { useState, useEffect } from "react";
// Se re-inserta la importación del CSS externo
import "../styles/subir-material.css";

function SubirMaterial() {
  // Obtener docenteId directamente de sessionStorage
  const docenteId = sessionStorage.getItem("docente_id");
  
  const [cursos, setCursos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState("");

  useEffect(() => {
    // La carga de cursos solo ocurre si el docenteId está disponible
    if (docenteId) {
        // La ruta es /api/material/cursos/ID
        fetch(`http://localhost:5000/api/material/cursos/${docenteId}`)
          .then(res => {
              if (!res.ok) {
                  // Si el error es 404 (no hay cursos), simplemente devuelve un array vacío
                  if (res.status === 404) return []; 
                  throw new Error('Error al obtener cursos');
              }
              return res.json();
          })
          .then(data => setCursos(data))
          .catch(err => console.error("Error al obtener cursos:", err));
    }
  }, [docenteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!docenteId) {
      // Reemplazamos alert() por un mensaje en consola ya que alert() no es permitido.
      console.error("Error: No se ha encontrado el ID del docente en la sesión.");
      return;
    }
    
    if (!archivo || !asignacionSeleccionada || !titulo) {
      console.error("Debes completar el título, seleccionar un curso y un archivo.");
      return;
    }
    
    if (asignacionSeleccionada === "") {
        console.error("Por favor, selecciona un curso válido.");
        return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);
    
    // Envía asignacion_id y docente_id (y el nuevo campo título)
    formData.append("asignacion_id", asignacionSeleccionada);
    formData.append("docente_id", docenteId); // Usamos el docenteId de sessionStorage
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    
    try {
      const response = await fetch("http://localhost:5000/api/material/subir", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Material subido correctamente");
        // Limpiar formulario
        setArchivo(null);
        setTitulo("");
        setDescripcion("");
        setAsignacionSeleccionada("");
        // Resetear el input de tipo file (si es posible)
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = null; 
      } else {
        console.error(data.error || "Error al subir material");
      }
    } catch (error) {
      console.error("Error al subir material:", error);
    }
  };

  return (
    // Se usa la clase CSS externa para el contenedor principal
    <div className="subir-material-container">
      <h2 className="title">
        <span role="img" aria-label="carpeta">📂</span>
        <span>Subir Material de Clase</span>
      </h2>
      
      {!docenteId && (
        <p className="error-message">
          ⚠️ Cargando ID del docente o no disponible. Por favor, asegúrese de iniciar sesión como docente.
        </p>
      )}

      <form onSubmit={handleSubmit} className="subir-form">
        <div className="form-group">
          <label htmlFor="curso-select">
            Seleccionar Curso (Asignación):
          </label>
          <select 
            id="curso-select"
            value={asignacionSeleccionada} 
            onChange={(e) => setAsignacionSeleccionada(e.target.value)}
            required
            disabled={!docenteId}
            className="form-control"
          >
            <option value="">-- Selecciona un curso/sección --</option>
            {cursos.map(c => (
              <option key={c.asignacion_id} value={c.asignacion_id}>
                {c.curso} ({c.seccion})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="titulo-input">
            Título del Material:
          </label>
          <input
            id="titulo-input"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: PPT Semana 5 - Introducción a Redes"
            required
            disabled={!docenteId}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion-textarea">
            Descripción:
          </label>
          <textarea
            id="descripcion-textarea"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del material..."
            disabled={!docenteId}
            rows="3"
            className="form-control"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="file-input">
            Archivo (PDF, Word, Excel, PPT, Imagen):
          </label>
          <input 
            id="file-input"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
            onChange={(e) => setArchivo(e.target.files[0])}
            required
            disabled={!docenteId}
            className="file-input"
          />
        </div>

        <button 
          type="submit" 
          className="btn-submit"
          disabled={!docenteId}
        >
          Subir Material
        </button>
      </form>
    </div>
  );
}

export default SubirMaterial;