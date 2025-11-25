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

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  const regexElectivo = /^EL\d{3}(I|II|III|IV|V|VI|VII|VIII|IX|X)$/;
  const regexNumerico = /^\d+$/;
  const romanToNumber = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  };
  // ======================
  // 1. Manejar cambios
  // ======================
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...curso, [name]: value };

    // si cambia el tipo → ajustar código automáticamente
    if (name === "tipo") {
      if (value === "Electivo" && !curso.codigo.startsWith("EL")) {
        updated.codigo = "EL";
      }
      if (value !== "Electivo" && curso.codigo.startsWith("EL")) {
        updated.codigo = "";
      }
    }

    // volver a validar
    validar(updated);

    setCurso(updated);
  };

  // ======================
  // 2. Validaciones
  // ======================
  const validar = (values) => {
    const errs = {};

    if (!values.codigo.trim()) errs.codigo = "El código es obligatorio";

    if (values.tipo === "Electivo") {
      if (!regexElectivo.test(values.codigo)) {
        errs.codigo = "Formato electivo incorrecto. Ej: EL402VI";
      }
    } else {
      if (!regexNumerico.test(values.codigo)) {
        errs.codigo = "Debe contener solo números";
      }
    }

    if (!values.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!values.creditos) errs.creditos = "Indique créditos";
    if (!values.ciclo) errs.ciclo = "Seleccione un ciclo";

    if (!values.horasTeoricas) errs.horasTeoricas = "Campo obligatorio";
    if (!values.horasPracticas) errs.horasPracticas = "Campo obligatorio";

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  // ======================
  // 3. Enviar al backend
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validar(curso)) {
      setMensaje("❌ Corrige los errores antes de enviar.");
      return;
    }

    const payload = {
      nombre: curso.nombre,
      codigo: curso.codigo,
      creditos: parseInt(curso.creditos),
      ciclo: curso.ciclo,
      horasTeoricas: parseInt(curso.horasTeoricas),
      horasPracticas: parseInt(curso.horasPracticas),
      tipo: curso.tipo,
      usuario_creacion: 1,
    };

    console.log("📤 Enviando datos al backend:", payload);

    try {
      const response = await fetch("http://localhost:5000/curso/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Curso registrado exitosamente.");
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
        setErrores({});
      } else {
        setMensaje("❌ Error: " + data.error);
      }
    } catch (error) {
      setMensaje("❌ Error de conexión con la API.");
    }
  };

  return (
    <div className="crear-curso">
      <h2>Registrar Curso</h2>
      <form onSubmit={handleSubmit} className="form-curso">
        <div className="campo">
          <label>
            Código del Curso:
            <input
              type="text"
              name="codigo"
              value={curso.codigo}
              onChange={handleChange}
              className={errores.codigo ? "input-error" : ""}
            />
          </label>
          {errores.codigo && <small className="error">{errores.codigo}</small>}
        </div>

        <div className="campo">
          <label>
            Nombre del Curso:
            <input
              type="text"
              name="nombre"
              value={curso.nombre}
              onChange={handleChange}
            />
          </label>
          {errores.nombre && <small className="error">{errores.nombre}</small>}
        </div>

        <div className="campo">
          <label>
            Créditos:
            <input
              type="number"
              name="creditos"
              value={curso.creditos}
              onChange={handleChange}
            />
          </label>
          {errores.creditos && (
            <small className="error">{errores.creditos}</small>
          )}
        </div>

        <div className="campo">
          <label>
            Ciclo:
            <select name="ciclo" value={curso.ciclo} onChange={handleChange}>
              <option value="">-- Selecciona un ciclo --</option>
              {Object.keys(romanToNumber).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {errores.ciclo && <small className="error">{errores.ciclo}</small>}
        </div>

        <div className="campo">
          <label>
            Escuela:
            <input type="text" name="escuela" value={curso.escuela} readOnly />
          </label>
        </div>

        <div className="campo">
          <label>
            Horas Teóricas*:
            <input
              type="number"
              name="horasTeoricas"
              value={curso.horasTeoricas}
              onChange={handleChange}
            />
          </label>
          {errores.horasTeoricas && (
            <small className="error">{errores.horasTeoricas}</small>
          )}
        </div>

        <div className="campo">
          <label>
            Horas Prácticas*:
            <input
              type="number"
              name="horasPracticas"
              value={curso.horasPracticas}
              onChange={handleChange}
            />
          </label>
          {errores.horasPracticas && (
            <small className="error">{errores.horasPracticas}</small>
          )}
        </div>

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
