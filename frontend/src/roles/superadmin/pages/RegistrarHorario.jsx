import { useState, useEffect } from "react";
import "../styles/registrar-horario.css";

export default function RegistrarHorario() {
  const [bloque, setBloque] = useState({
    codigo_bloque: "",
    dia: "",
    hora_inicio: "",
    hora_fin: "",
    estado: "Activo",
  });

  const [mensaje, setMensaje] = useState("");
  const [duracion, setDuracion] = useState("");
  const [turno, setTurno] = useState("");
  const [contador, setContador] = useState(1); // número incremental local

  const calcularDatos = (inicio, fin, dia) => {
    if (!inicio || !fin) {
      setDuracion("");
      setTurno("");
      setBloque((prev) => ({ ...prev, codigo_bloque: "" }));
      return;
    }

    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fin.split(":").map(Number);
    let totalMin = h2 * 60 + m2 - (h1 * 60 + m1);

    if (totalMin <= 0) {
      setDuracion("⛔ Horario inválido");
      setTurno("");
      setBloque((prev) => ({ ...prev, codigo_bloque: "" }));
      return;
    }

    if (totalMin > 360) {
      setDuracion("⛔ Excede las 6 horas permitidas");
      setTurno("");
      setBloque((prev) => ({ ...prev, codigo_bloque: "" }));
      return;
    }

    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    const textoDuracion =
      horas > 0
        ? `${horas} hora${horas > 1 ? "s" : ""}${
            minutos > 0 ? ` ${minutos} min` : ""
          }`
        : `${minutos} min`;
    setDuracion(textoDuracion);

    // Detectar turno
    let turnoLetra = "";
    if (h1 < 12) {
      setTurno("Mañana");
      turnoLetra = "M";
    } else if (h1 < 19) {
      setTurno("Tarde");
      turnoLetra = "T";
    } else {
      setTurno("Noche");
      turnoLetra = "N";
    }

    // Generar código automático si hay día
    if (dia) {
      const codigo = `${dia.slice(0, 3).toUpperCase()}-${turnoLetra}-${String(
        contador
      ).padStart(3, "0")}`;
      setBloque((prev) => ({ ...prev, codigo_bloque: codigo }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nuevoBloque = { ...bloque, [name]: value };
    setBloque(nuevoBloque);

    if (name === "hora_inicio" || name === "hora_fin" || name === "dia") {
      calcularDatos(
        name === "hora_inicio" ? value : nuevoBloque.hora_inicio,
        name === "hora_fin" ? value : nuevoBloque.hora_fin,
        name === "dia" ? value : nuevoBloque.dia
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bloque.dia || !bloque.hora_inicio || !bloque.hora_fin) {
      setMensaje("⚠️ Todos los campos obligatorios deben estar completos.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/superadmin/bloques-horarios",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bloque),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Bloque horario registrado correctamente.");
        setContador((prev) => prev + 1); // incrementar número de bloque
        setBloque({
          codigo_bloque: "",
          dia: "",
          hora_inicio: "",
          hora_fin: "",
          estado: "Activo",
        });
        setDuracion("");
        setTurno("");
      } else {
        setMensaje("❌ Error: " + (data.error || "Error desconocido."));
      }
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error de conexión con la API.");
    }
  };

  return (
    <div className="registrar-horario">
      <h2>📅 Registrar Nuevo Bloque Horario</h2>

      <form onSubmit={handleSubmit} className="form-horario">
        <label>
          Día de la Semana*:
          <select name="dia" value={bloque.dia} onChange={handleChange}>
            <option value="">-- Seleccione día --</option>
            <option value="Lunes">Lunes</option>
            <option value="Martes">Martes</option>
            <option value="Miércoles">Miércoles</option>
            <option value="Jueves">Jueves</option>
            <option value="Viernes">Viernes</option>
            <option value="Sábado">Sábado</option>
          </select>
        </label>

        <label>
          Hora Inicio*:
          <input
            type="time"
            name="hora_inicio"
            value={bloque.hora_inicio}
            onChange={handleChange}
          />
          <small>Formato 24h (HH:MM)</small>
        </label>

        <label>
          Hora Fin*:
          <input
            type="time"
            name="hora_fin"
            value={bloque.hora_fin}
            onChange={handleChange}
          />
          <small>Formato 24h (HH:MM)</small>
        </label>

        <label>
          Estado*:
          <select name="estado" value={bloque.estado} onChange={handleChange}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </label>

        <label>
          Código del Bloque*:
          <input
            type="text"
            name="codigo_bloque"
            value={bloque.codigo_bloque}
            onChange={handleChange}
            placeholder="Ejemplo: LUN-M1"
            readOnly // 🔹 opcional si lo generas automáticamente desde el backend
          />
          <small>
            Se genera automáticamente según el día y el turno. Ejemplo: LUN-M1,
            MAR-T2, MIÉ-N3.
          </small>
        </label>

        <div className="info-automatica">
          <p>Duración: {duracion || "—"}</p>
          <p>Turno: {turno || "—"}</p>
        </div>

        <div className="botones">
          <button
            type="button"
            className="btn-cancelar"
            onClick={() => window.history.back()}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-guardar">
            Guardar Bloque
          </button>
        </div>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
}
