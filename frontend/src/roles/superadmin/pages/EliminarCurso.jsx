import { useState, useEffect } from "react";
import "../styles/eliminar-curso.css";

export default function EliminarCurso() {
  const [cursos, setCursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Cargar cursos desde la API
  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      const response = await fetch("http://localhost:5000/curso/");
      if (response.ok) {
        const data = await response.json();
        setCursos(data);
      } else {
        setMensaje("❌ Error al cargar los cursos");
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("❌ Error de conexión con la API");
    }
  };

  // Filtrar cursos por búsqueda
  const cursosFiltrados = cursos.filter(
    (curso) =>
      curso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para verificar si el curso puede ser eliminado
  const verificarEliminacion = async (curso) => {
    try {
      // Verificar si tiene estudiantes matriculados
      const responseEstudiantes = await fetch(
        `http://localhost:5000/curso/${curso.curso_id}/estudiantes`
      );
      
      // Verificar si tiene docente asignado
      const responseDocente = await fetch(
        `http://localhost:5000/curso/${curso.curso_id}/docente`
      );

      let tieneEstudiantes = false;
      let tieneDocente = false;

      if (responseEstudiantes.ok) {
        const dataEstudiantes = await responseEstudiantes.json();
        tieneEstudiantes = dataEstudiantes.tiene_estudiantes;
      }

      if (responseDocente.ok) {
        const dataDocente = await responseDocente.json();
        tieneDocente = dataDocente.tiene_docente;
      }

      return { tieneEstudiantes, tieneDocente };
    } catch (error) {
      console.error("Error en verificación:", error);
      setMensaje("⚠️ Error al verificar las condiciones del curso");
      return { tieneEstudiantes: false, tieneDocente: false };
    }
  };

  const handleEliminarClick = async (curso) => {
    setSelectedCurso(curso);
    setMensaje(""); // Limpiar mensajes anteriores

    // Validar según criterios de aceptación
    const { tieneEstudiantes, tieneDocente } = await verificarEliminacion(curso);

    if (tieneEstudiantes) {
      setWarningMessage(
        "No se puede eliminar el curso porque tiene estudiantes matriculados."
      );
      setShowWarningModal(true);
      return;
    }

    if (tieneDocente) {
      setWarningMessage(
        "No se puede eliminar el curso porque está asignado a un docente."
      );
      setShowWarningModal(true);
      return;
    }

    // Si pasa todas las validaciones, mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  const confirmarEliminacion = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/curso/eliminar/${selectedCurso.curso_id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Eliminar del estado local (desaparece inmediatamente)
        setCursos(cursos.filter((c) => c.curso_id !== selectedCurso.curso_id));
        setMensaje("✅ Curso eliminado exitosamente");
        setShowConfirmModal(false);
        setSelectedCurso(null);
      } else {
        const data = await response.json();
        setMensaje("❌ Error: " + data.error);
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("❌ Error de conexión con la API");
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eliminar-curso">
      <div className="header-section">
        <h2>🗑️ Eliminar Curso de la Malla Curricular</h2>
        <p className="subtitle">
          Gestiona la eliminación de cursos que ya no forman parte del plan de
          estudios
        </p>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o código del curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {mensaje && <div className="mensaje-alert">{mensaje}</div>}

      <div className="cursos-grid">
        {cursosFiltrados.length === 0 ? (
          <div className="no-results">
            <p>📚 No se encontraron cursos</p>
          </div>
        ) : (
          cursosFiltrados.map((curso) => (
            <div key={curso.curso_id} className="curso-card">
              <div className="curso-header">
                <span className="curso-codigo">{curso.codigo}</span>
                <span className="curso-ciclo">Ciclo {curso.ciclo}</span>
              </div>

              <h3 className="curso-nombre">{curso.nombre}</h3>

              <div className="curso-info">
                <div className="info-item">
                  <strong>Créditos:</strong> {curso.creditos}
                </div>
                <div className="info-item">
                  <strong>Tipo:</strong> {curso.tipo || "Obligatorio"}
                </div>
                <div className="info-item">
                  <strong>Horas:</strong> T:{curso.horas_teoricas} / P:
                  {curso.horas_practicas}
                </div>
              </div>

              <button
                className="btn-eliminar"
                onClick={() => handleEliminarClick(curso)}
              >
                🗑️ Eliminar Curso
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ ¿Confirmar eliminación?</h3>

            <div className="modal-body">
              <p>Estás a punto de eliminar el siguiente curso:</p>
              <div className="curso-detail">
                <strong>{selectedCurso?.codigo}</strong> - {selectedCurso?.nombre}
              </div>
              <p className="warning-text">
                ⚠️ Esta acción no se puede deshacer. El curso desaparecerá
                inmediatamente de la lista.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedCurso(null);
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm"
                onClick={confirmarEliminacion}
                disabled={loading}
              >
                {loading ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Advertencia */}
      {showWarningModal && (
        <div className="modal-overlay" onClick={() => setShowWarningModal(false)}>
          <div className="modal-content modal-warning" onClick={(e) => e.stopPropagation()}>
            <h3>❌ No se puede eliminar</h3>

            <div className="modal-body">
              <div className="curso-detail">
                <strong>{selectedCurso?.codigo}</strong> - {selectedCurso?.nombre}
              </div>
              <p className="error-message">{warningMessage}</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowWarningModal(false);
                  setSelectedCurso(null);
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}