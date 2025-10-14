import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/actualizar-cursos.css";

export default function ActualizarCurso() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState("");
  const [curso, setCurso] = useState({
    codigo: "",
    nombre: "",
    creditos: "",
    ciclo: "",
    horasTeoricas: "",
    horasPracticas: "",
    tipo: "Obligatorio",
    escuela: "Escuela Profesional de Ingeniería de Sistemas",
  });
  const [cursoOriginal, setCursoOriginal] = useState(null);

  const [mensaje, setMensaje] = useState("");
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [cambiosPeligrosos, setCambiosPeligrosos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoCursos, setCargandoCursos] = useState(true);

  // Cargar lista de cursos al montar el componente
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const response = await fetch("http://localhost:5000/curso/");
        if (response.ok) {
          const data = await response.json();
          setCursos(data);
        } else {
          setMensaje("❌ Error al cargar la lista de cursos");
        }
      } catch (error) {
        setMensaje("❌ Error de conexión con la API");
        console.error(error);
      } finally {
        setCargandoCursos(false);
      }
    };

    cargarCursos();
  }, []);

  // Cargar automáticamente el curso cuando se selecciona
  useEffect(() => {
    if (cursoSeleccionadoId) {
      cargarCursoSeleccionado();
    } else {
      // Limpiar formulario si no hay curso seleccionado
      setCurso({
        codigo: "",
        nombre: "",
        creditos: "",
        ciclo: "",
        horasTeoricas: "",
        horasPracticas: "",
        tipo: "Obligatorio",
        escuela: "Escuela Profesional de Ingeniería de Sistemas",
      });
      setCursoOriginal(null);
      setMensaje("");
    }
  }, [cursoSeleccionadoId]);

  // Cargar datos del curso seleccionado
  const cargarCursoSeleccionado = async () => {
    if (!cursoSeleccionadoId) return;

    setCargando(true);
    setMensaje("");

    try {
      const response = await fetch(
        `http://localhost:5000/curso/${cursoSeleccionadoId}`
      );

      if (response.ok) {
        const data = await response.json();

        // Guardar datos originales para comparar cambios
        setCursoOriginal(data);

        // Actualizar estado del curso con los datos cargados
        setCurso({
          codigo: data.codigo || "",
          nombre: data.nombre || "",
          creditos: data.creditos?.toString() || "",
          ciclo: data.ciclo || "",
          horasTeoricas: data.horas_teoricas?.toString() || "",
          horasPracticas: data.horas_practicas?.toString() || "",
          tipo: data.tipo || "Obligatorio",
          escuela: "Escuela Profesional de Ingeniería de Sistemas",
        });

        setMensaje("✅ Curso cargado correctamente");
      } else {
        const errorData = await response.json();
        setMensaje(
          `❌ Error: ${errorData.error || "No se pudo cargar el curso"}`
        );
      }
    } catch (error) {
      setMensaje("❌ Error de conexión con el servidor");
      console.error("Error cargando curso:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const verificarCambiosPeligrosos = () => {
    if (!cursoOriginal) return false;

    const cambios = [];

    // Verificar cambios en créditos
    if (parseInt(curso.creditos) !== cursoOriginal.creditos) {
      cambios.push(
        `Créditos cambiados de ${cursoOriginal.creditos} a ${curso.creditos}`
      );
    }

    // Verificar cambios en ciclo
    if (curso.ciclo !== cursoOriginal.ciclo) {
      cambios.push(`Ciclo cambiado de ${cursoOriginal.ciclo} a ${curso.ciclo}`);
    }

    // Verificar cambios en horas teóricas
    if (parseInt(curso.horasTeoricas) !== cursoOriginal.horas_teoricas) {
      cambios.push(
        `Horas teóricas cambiadas de ${cursoOriginal.horas_teoricas} a ${curso.horasTeoricas}`
      );
    }

    // Verificar cambios en horas prácticas
    if (parseInt(curso.horasPracticas) !== cursoOriginal.horas_practicas) {
      cambios.push(
        `Horas prácticas cambiadas de ${cursoOriginal.horas_practicas} a ${curso.horasPracticas}`
      );
    }

    setCambiosPeligrosos(cambios);
    return cambios.length > 0;
  };

  const validarCampos = () => {
    if (!curso.codigo.trim()) return "⚠️ El código del curso es obligatorio";
    if (!curso.nombre.trim()) return "⚠️ El nombre del curso es obligatorio";
    if (!curso.creditos) return "⚠️ Los créditos son obligatorios";
    if (!curso.ciclo) return "⚠️ El ciclo es obligatorio";
    if (!curso.horasTeoricas) return "⚠️ Las horas teóricas son obligatorias";
    if (!curso.horasPracticas) return "⚠️ Las horas prácticas son obligatorias";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorValidacion = validarCampos();
    if (errorValidacion) {
      setMensaje(errorValidacion);
      return;
    }

    // Verificar cambios peligrosos
    const hayCambiosPeligrosos = verificarCambiosPeligrosos();
    if (hayCambiosPeligrosos && !mostrarAdvertencia) {
      setMostrarAdvertencia(true);
      return;
    }

    // Realizar la actualización
    await actualizarCurso();
  };

  const actualizarCurso = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/curso/actualizar/${cursoSeleccionadoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: curso.codigo,
            nombre: curso.nombre,
            creditos: parseInt(curso.creditos),
            ciclo: curso.ciclo,
            horas_teoricas: parseInt(curso.horasTeoricas),
            horas_practicas: parseInt(curso.horasPracticas),
            tipo: curso.tipo,
            usuario_modificacion: 1,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Curso actualizado exitosamente");
        setMostrarAdvertencia(false);

        // Recargar la lista de cursos para reflejar los cambios
        const refreshResponse = await fetch("http://localhost:5000/curso/");
        if (refreshResponse.ok) {
          const refreshedCursos = await refreshResponse.json();
          setCursos(refreshedCursos);
        }
      } else {
        setMensaje(
          `❌ Error: ${data.error || "No se pudo actualizar el curso"}`
        );
        setMostrarAdvertencia(false);
      }
    } catch (error) {
      setMensaje("❌ Error de conexión con el servidor");
      setMostrarAdvertencia(false);
      console.error(error);
    }
  };

  const cancelarActualizacion = () => {
    setMostrarAdvertencia(false);
  };

  const limpiarSeleccion = () => {
    setCursoSeleccionadoId("");
    setCurso({
      codigo: "",
      nombre: "",
      creditos: "",
      ciclo: "",
      horasTeoricas: "",
      horasPracticas: "",
      tipo: "Obligatorio",
      escuela: "Escuela Profesional de Ingeniería de Sistemas",
    });
    setCursoOriginal(null);
    setMensaje("");
  };

  // Verificar si hay cambios en el formulario
  const hayCambios = () => {
    if (!cursoOriginal) return false;

    return (
      curso.codigo !== cursoOriginal.codigo ||
      curso.nombre !== cursoOriginal.nombre ||
      parseInt(curso.creditos) !== cursoOriginal.creditos ||
      curso.ciclo !== cursoOriginal.ciclo ||
      parseInt(curso.horasTeoricas) !== cursoOriginal.horas_teoricas ||
      parseInt(curso.horasPracticas) !== cursoOriginal.horas_practicas ||
      curso.tipo !== cursoOriginal.tipo
    );
  };

  return (
    <div className="actualizar-cursos">
      <h2>✏️ Actualizar Curso</h2>

      {/* Selección de curso */}
      <div className="seleccion-curso">
        <h3>1. Seleccionar Curso a Actualizar</h3>
        <div className="selector-curso">
          <select
            value={cursoSeleccionadoId}
            onChange={(e) => setCursoSeleccionadoId(e.target.value)}
            disabled={cargandoCursos}
          >
            <option value="">-- Selecciona un curso --</option>
            {cursos.map((curso) => (
              <option key={curso.curso_id} value={curso.curso_id}>
                {curso.codigo} - {curso.nombre} (Ciclo {curso.ciclo})
              </option>
            ))}
          </select>
          <button onClick={limpiarSeleccion} className="btn-cancelar">
            🔄 Cambiar Curso
          </button>
        </div>
        {cargando && <div className="cargando-mini">Cargando curso...</div>}
      </div>

      {cargandoCursos && (
        <div className="cargando">Cargando lista de cursos...</div>
      )}

      {/* Formulario de actualización */}
      {cursoOriginal && (
        <div className="formulario-actualizacion">
          <h3>2. Modificar Información del Curso</h3>

          {/* Información del curso actual */}
          <div className="info-curso-actual">
            <h4>Curso Seleccionado:</h4>
            <p>
              <strong>
                {cursoOriginal.codigo} - {cursoOriginal.nombre}
              </strong>
            </p>
            <p>
              <strong>Ciclo Actual:</strong> {cursoOriginal.ciclo} |{" "}
              <strong>Créditos:</strong> {cursoOriginal.creditos}
            </p>
          </div>

          {mostrarAdvertencia && (
            <div className="advertencia-matricula">
              <h4>⚠️ Advertencia: Cambios que afectan la matrícula</h4>
              <p>
                Los siguientes cambios pueden impactar en estudiantes
                matriculados:
              </p>
              <ul>
                {cambiosPeligrosos.map((cambio, index) => (
                  <li key={index}>{cambio}</li>
                ))}
              </ul>
              <div className="botones-advertencia">
                <button onClick={actualizarCurso} className="btn-confirmar">
                  ✅ Confirmar Actualización
                </button>
                <button
                  onClick={cancelarActualizacion}
                  className="btn-cancelar-advertencia"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid-formulario">
              <div className="grupo-formulario">
                <label>Código del Curso *</label>
                <input
                  type="text"
                  name="codigo"
                  value={curso.codigo}
                  onChange={handleChange}
                  placeholder="Ej: CS101"
                  required
                />
              </div>

              <div className="grupo-formulario">
                <label>Nombre del Curso *</label>
                <input
                  type="text"
                  name="nombre"
                  value={curso.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Programación I"
                  required
                />
              </div>

              <div className="grupo-formulario">
                <label>Créditos *</label>
                <input
                  type="number"
                  name="creditos"
                  value={curso.creditos}
                  onChange={handleChange}
                  min="1"
                  max="6"
                  required
                />
              </div>

              <div className="grupo-formulario">
                <label>Ciclo *</label>
                <select
                  name="ciclo"
                  value={curso.ciclo}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Selecciona ciclo --</option>
                  <option value="I">I</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                  <option value="VI">VI</option>
                  <option value="VII">VII</option>
                  <option value="VIII">VIII</option>
                  <option value="IX">IX</option>
                  <option value="X">X</option>
                </select>
              </div>

              <div className="grupo-formulario">
                <label>Horas Teóricas *</label>
                <input
                  type="number"
                  name="horasTeoricas"
                  value={curso.horasTeoricas}
                  onChange={handleChange}
                  min="0"
                  max="8"
                  required
                />
              </div>

              <div className="grupo-formulario">
                <label>Horas Prácticas *</label>
                <input
                  type="number"
                  name="horasPracticas"
                  value={curso.horasPracticas}
                  onChange={handleChange}
                  min="0"
                  max="8"
                  required
                />
              </div>

              <div className="grupo-formulario">
                <label>Tipo de Curso</label>
                <select name="tipo" value={curso.tipo} onChange={handleChange}>
                  <option value="Obligatorio">Obligatorio</option>
                  <option value="Electivo">Electivo</option>
                  <option value="Complementario">Complementario</option>
                </select>
              </div>

              <div className="grupo-formulario">
                <label>Escuela</label>
                <input
                  type="text"
                  value={curso.escuela}
                  readOnly
                  className="campo-readonly"
                />
              </div>
            </div>

            <div className="botones-accion">
              <button
                type="submit"
                className="btn-actualizar"
                disabled={!hayCambios()}
              >
                {hayCambios() ? "💾 Actualizar Curso" : "✅ Sin cambios"}
              </button>
              <button
                type="button"
                onClick={limpiarSeleccion}
                className="btn-cancelar"
              >
                🔄 Seleccionar Otro Curso
              </button>
              <button
                type="button"
                onClick={() => navigate("/superadmin/consultar-cursos")}
                className="btn-cancelar"
              >
                ← Volver a Consultar
              </button>
            </div>
          </form>

          {hayCambios() &&
            cambiosPeligrosos.length > 0 &&
            !mostrarAdvertencia && (
              <div className="info-cambios">
                <p>
                  ℹ️ Algunos cambios pueden afectar estudiantes matriculados
                </p>
              </div>
            )}
        </div>
      )}

      {mensaje && (
        <div
          className={`mensaje ${
            mensaje.includes("✅")
              ? "success"
              : mensaje.includes("❌")
              ? "error"
              : "warning"
          }`}
        >
          {mensaje}
        </div>
      )}
    </div>
  );
}
