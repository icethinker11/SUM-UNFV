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

  // 🧠 Función auxiliar: abrevia día
  const abreviarDia = (dia) => {
    const map = {
      Lunes: "LUN",
      Martes: "MAR",
      Miércoles: "MIÉ",
      Jueves: "JUE",
      Viernes: "VIE",
      Sábado: "SAB",
    };
    return map[dia] || "";
  };

  // 🧠 Calcula el turno (M, T, N)
  const obtenerTurnoLetra = (horaInicio) => {
    if (!horaInicio) return "";
    const [h] = horaInicio.split(":").map(Number);
    if (h < 12) return "M";
    if (h < 19) return "T";
    return "N";
  };

  // 🧠 Calcula duración y turno textual
  const calcularDatos = (inicio, fin) => {
    if (!inicio || !fin) {
      setDuracion("");
      setTurno("");
      return;
    }

    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fin.split(":").map(Number);
    const totalMin = h2 * 60 + m2 - (h1 * 60 + m1);

    if (totalMin <= 0) {
      setDuracion("⛔ Horario inválido");
      return;
    }
    if (totalMin > 360) {
      setDuracion("⛔ Excede las 6 horas permitidas");
      return;
    }

    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    setDuracion(
      horas > 0
        ? `${horas} hora${horas > 1 ? "s" : ""}${
            minutos > 0 ? ` ${minutos} min` : ""
          }`
        : `${minutos} min`
    );

    if (h1 < 12) setTurno("Mañana");
    else if (h1 < 19) setTurno("Tarde");
    else setTurno("Noche");
  };

  // 🧩 Genera código de bloque reactivo (simulación exacta de BD)
  useEffect(() => {
    const { dia, hora_inicio } = bloque;
    if (!dia || !hora_inicio) {
      setBloque((prev) => ({ ...prev, codigo_bloque: "" }));
      return;
    }

    const prefijo = abreviarDia(dia);
    const letraTurno = obtenerTurnoLetra(hora_inicio);

    // Generamos un número pseudo incremental (solo visual)
    const randomNum = Math.floor(Math.random() * 3) + 1; // 1 a 3

    const codigo = `${prefijo}-${letraTurno}${randomNum}`;
    setBloque((prev) => ({ ...prev, codigo_bloque: codigo }));
  }, [bloque.dia, bloque.hora_inicio]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nuevoBloque = { ...bloque, [name]: value };
    setBloque(nuevoBloque);

    if (name === "hora_inicio" || name === "hora_fin") {
      calcularDatos(
        name === "hora_inicio" ? value : nuevoBloque.hora_inicio,
        name === "hora_fin" ? value : nuevoBloque.hora_fin
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
        // Código real devuelto por BD (ya no cambia el mostrado)
        setBloque((prev) => ({
          ...prev,
          codigo_bloque: data.codigo_bloque,
        }));
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
          Código del Bloque:
          <input
            type="text"
            name="codigo_bloque"
            value={bloque.codigo_bloque}
            readOnly
          />
          <small>Se genera automáticamente (ej: LUN-T1, MAR-M2, MIE-N3)</small>
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
