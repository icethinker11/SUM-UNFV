import { useState } from "react";
import "../styles/crear-curso.css";
export default function CrearCurso() {
  const [curso, setCurso] = useState({
    nombre: "",
    codigo: "",
    creditos: "",
    ciclo: "",
    escuela: "Escuela Profesional de Ingeniería de Sistemas",
    horasTeoricas: "",
    horasPracticas: "",
    tipo: "Obligatorio",
  });

  const [mensaje, setMensaje] = useState("");

  // ✅ esta función tiene que existir
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso({ ...curso, [name]: value });
  };

  const validarCampos = () => {
    if (!curso.codigo.trim()) return "⚠️ El código es obligatorio.";
    if (!curso.nombre.trim()) return "⚠️ El nombre es obligatorio.";
    if (!curso.creditos) return "⚠️ Los créditos son obligatorios.";
    if (!curso.ciclo) return "⚠️ El ciclo es obligatorio.";
    if (!curso.horasTeoricas) return "⚠️ Las horas teóricas son obligatorias.";
    if (!curso.horasPracticas)
      return "⚠️ Las horas prácticas son obligatorias.";
    return null; // significa que no hay errores
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !curso.nombre ||
      !curso.codigo ||
      !curso.creditos ||
      !curso.ciclo ||
      !curso.horasTeoricas ||
      !curso.horasPracticas
    ) {
      setMensaje("⚠️ Todos los campos obligatorios deben estar completos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/curso/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: curso.nombre,
          codigo: curso.codigo,
          creditos: parseInt(curso.creditos),
          ciclo: curso.ciclo,
          horasTeoricas: parseInt(curso.horasTeoricas),
          horasPracticas: parseInt(curso.horasPracticas),
          tipo: curso.tipo,
          usuario_creacion: 1,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Curso registrado exitosamente.");
        console.log("Curso creado:", data);
        setCurso({
          nombre: "",
          codigo: "",
          creditos: "",
          ciclo: "",
          escuela: "Escuela Profesional de Ingeniería de Sistemas",
          horasTeoricas: "",
          horasPracticas: "",
          tipo: "Obligatorio",
        });
      } else {
        setMensaje("❌ Error: " + data.error);
      }
    } catch (error) {
      setMensaje("❌ Error de conexión con la API.");
      console.error(error);
    }
  };

  return (
    <div className="crear-curso">
      <h2>📝 Registrar Curso</h2>
      <form onSubmit={handleSubmit} className="form-curso">
        <label>
          Código del Curso*:
          <input
            type="text"
            name="codigo"
            value={curso.codigo}
            onChange={handleChange}
          />
        </label>

        <label>
          Nombre del Curso*:
          <input
            type="text"
            name="nombre"
            value={curso.nombre}
            onChange={handleChange}
          />
        </label>

        <label>
          Créditos*:
          <input
            type="number"
            name="creditos"
            value={curso.creditos}
            onChange={handleChange}
          />
        </label>

        <label>
          Ciclo*:
          <select name="ciclo" value={curso.ciclo} onChange={handleChange}>
            <option value="">-- Selecciona un ciclo --</option>
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
        </label>

        <label>
          Escuela:
          <input type="text" name="escuela" value={curso.escuela} readOnly />
        </label>

        <label>
          Horas Teóricas*:
          <input
            type="number"
            name="horasTeoricas"
            value={curso.horasTeoricas}
            onChange={handleChange}
          />
        </label>

        <label>
          Horas Prácticas*:
          <input
            type="number"
            name="horasPracticas"
            value={curso.horasPracticas}
            onChange={handleChange}
          />
        </label>

        <label>
          Tipo de Curso:
          <select name="tipo" value={curso.tipo} onChange={handleChange}>
            <option value="Obligatorio">Obligatorio</option>
            <option value="Electivo">Electivo</option>
            <option value="Complementario">Complementario</option>
          </select>
        </label>

        <button type="submit">Registrar Curso</button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
}
