import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/prerrequisitos.css";
import { FaSave, FaTrash, FaBroom } from "react-icons/fa";
import { ListChecks } from "lucide-react"; // AJUSTE: Usamos ListChecks para el título (como en el CSS)

const GestionPrerrequisitos = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoPrincipal, setCursoPrincipal] = useState("");
  const [cursoRequisito, setCursoRequisito] = useState("");
  const [prerrequisitos, setPrerrequisitos] = useState([]);
  const [mensaje, setMensaje] = useState("");

  // AJUSTE: Usar la ruta base sin el puerto si usas proxy en Vite (mejor práctica). 
  // Mantendré el puerto por si ejecutas Flask y React sin proxy.
  const BASE_URL = "http://localhost:5000"; 

  // Cargar cursos al iniciar
  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      // AJUSTE: La API para listar todos los cursos la definimos en /superadmin/cursos
      // Si usaste la ruta /curso/ que enviaste antes, podría estar bien, pero la más limpia es la del SuperAdmin.
      // Usaremos la ruta /curso/ que indicaste en el código original.
      const res = await axios.get(`${BASE_URL}/curso/`); 
      
      // AJUSTE: Las propiedades de los cursos en el backend son 'curso_id', 'codigo', y 'nombre'.
      // El backend de listar cursos retorna un ARRAY, no un objeto. No necesitamos res.data.cursos.
      setCursos(res.data); 
    } catch (err) {
      console.error("Error al cargar cursos:", err);
    }
  };

  const cargarPrerrequisitos = async (idCurso) => {
    // Limpiamos el mensaje de la acción anterior
    setMensaje(""); 
    try {
      const res = await axios.get(`${BASE_URL}/superadmin/prerrequisitos/${idCurso}`);
      setPrerrequisitos(res.data);
    } catch (err) {
      console.error("Error al cargar prerrequisitos:", err);
      // AJUSTE: Captura errores de 404/400 de Flask, que podría devolver un objeto con error.
      setPrerrequisitos([]); 
      setMensaje(err.response?.data?.error || "Error al cargar prerrequisitos ❌");
    }
  };

  const manejarCursoPrincipal = (id) => {
    setCursoPrincipal(id);
    if (id) cargarPrerrequisitos(id);
    else setPrerrequisitos([]); // Limpiar la tabla si se selecciona la opción por defecto
  };

  const guardarPrerrequisito = async () => {
    if (!cursoPrincipal || !cursoRequisito) {
      setMensaje("Selecciona ambos cursos ⚠️");
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/superadmin/definir-prerrequisito`, {
        // AJUSTE: Convertir a número (aunque Flask puede manejar el string, es buena práctica)
        id_curso: parseInt(cursoPrincipal), 
        id_curso_requerido: parseInt(cursoRequisito),
      });
      
      // AJUSTE: El mensaje de éxito es 201 y se obtiene del backend
      setMensaje(res.data.mensaje || "Prerrequisito agregado ✅");
      cargarPrerrequisitos(cursoPrincipal);
      setCursoRequisito("");
    } catch (err) {
      setMensaje(err.response?.data?.error || "Error al agregar prerrequisito ❌");
    }
  };

  const eliminarPrerrequisito = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este prerrequisito?")) return;
    try {
      await axios.delete(`${BASE_URL}/superadmin/prerrequisitos/${id}`);
      setMensaje("Prerrequisito eliminado ✅");
      // Mantenemos la lógica de recarga para asegurar que la lista esté actualizada.
      cargarPrerrequisitos(cursoPrincipal); 
    } catch (err) {
      setMensaje("Error al eliminar prerrequisito ❌");
    }
  };

  const limpiarCampos = () => {
    // AJUSTE: En lugar de limpiar todo, solo limpiamos los selectores de la acción POST.
    setCursoRequisito("");
    setMensaje("");
  };

  return (
    <div className="contenedor-prerrequisitos">
      {/* AJUSTE: Usamos ListChecks y tags HTML limpios */}
      <h2 className="section-title-prerreq">
        <ListChecks size={28} style={{ marginRight: '10px' }} /> 
        Gestión de Prerrequisitos
      </h2>

      <div className="formulario-prerreq">
        <div className="grupo">
          <label>Curso Principal</label>
          <select
            value={cursoPrincipal}
            onChange={(e) => manejarCursoPrincipal(e.target.value)}
          >
            <option value="">Seleccione curso principal</option>
            {cursos.map((c) => (
              <option key={c.curso_id} value={c.curso_id}>
                {c.codigo} - {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grupo">
          <label>Agregar Prerrequisito</label>
          <select
            value={cursoRequisito}
            onChange={(e) => setCursoRequisito(e.target.value)}
          >
            <option value="">Seleccione curso prerrequisito</option>
            {cursos
              // Filtramos para evitar que el curso principal sea su propio requisito.
              .filter((c) => c.curso_id !== parseInt(cursoPrincipal)) 
              .map((c) => (
                <option key={c.curso_id} value={c.curso_id}>
                  {c.codigo} - {c.nombre}
                </option>
              ))}
          </select>
        </div>

        <div className="botones">
          <button className="btn-guardar" onClick={guardarPrerrequisito}>
            <FaSave /> Guardar
          </button>
          <button className="btn-limpiar" onClick={limpiarCampos}>
            <FaBroom /> Limpiar
          </button>
        </div>
      </div>

      {/* Mensajes de feedback usando clases de tu CSS para éxito/error */}
      {mensaje && (
        <p className={`mensaje-box mensaje ${mensaje.includes("✅") ? "success" : "error"}`}>
            {mensaje}
        </p>
      )}

      <div className="tabla-prerreq">
        {/* Usamos el estado del curso principal para decidir qué mostrar */}
        {cursoPrincipal && prerrequisitos.length > 0 ? (
          <table>
            <thead>
              <tr>
                {/* Omitimos el ID si no es crucial, o lo mostramos para depuración */}
                <th>Curso Requerido</th> 
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {prerrequisitos.map((p) => (
                // AJUSTE: La propiedad del ID se llama id_prerrequisito en tu backend
                <tr key={p.id_prerrequisito}>
                  {/* AJUSTE: La propiedad del nombre se llama curso_requerido en tu backend */}
                  <td>{p.curso_requerido}</td> 
                  <td>
                    <button
                      className="btn-eliminar"
                      onClick={() => eliminarPrerrequisito(p.id_prerrequisito)}
                    >
                      <FaTrash /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : cursoPrincipal ? (
          // Mensaje si el curso tiene cero prerrequisitos
          <p className="info">Este curso no tiene prerrequisitos.</p>
        ) : (
          // Mensaje inicial
          <p className="info">Seleccione un curso para ver sus prerrequisitos.</p>
        )}
      </div>
    </div>
  );
};

export default GestionPrerrequisitos;