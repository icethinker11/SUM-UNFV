import { useState, useEffect } from "react";
import "../styles/registrar-horario.css";

export default function CrearBloque() {
  const [bloque, setBloque] = useState({
    codigo_bloque: "",
    dia: "",
    hora_inicio: "",
    hora_fin: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [duracion, setDuracion] = useState("");
  const [turno, setTurno] = useState("");
  const [bloqueValido, setBloqueValido] = useState(false);
  const [loading, setLoading] = useState(false);

  // Obtiene el próximo código real desde el backend
  const obtenerCodigoSugerido = async (dia, horaInicio) => {
    if (!dia || !horaInicio) return;

    try {
      const url = `http://localhost:5000/superadmin/bloques-horarios/proximo-codigo?dia=${dia}&hora_inicio=${horaInicio}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setBloque((prev) => ({
          ...prev,
          codigo_bloque: data.codigo_sugerido,
        }));
      }
    } catch (e) {
      console.error("Error al obtener código sugerido:", e);
    }
  };
  // Mapa para abreviar días
  const abreviarDia = (dia) => {
    const map = {
      Lunes: "LUN",
      Martes: "MAR",
      Miércoles: "MIE",
      Jueves: "JUE",
      Viernes: "VIE",
      Sábado: "SAB",
    };
    return map[dia] || "";
  };

  // Turno letra
  const obtenerTurnoLetra = (horaInicio) => {
    if (!horaInicio) return "";
    const [h] = horaInicio.split(":").map(Number);
    if (h < 12) return "M";
    if (h < 19) return "T";
    return "N";
  };

  // Calcula duración en minutos
  const calcularDatos = (inicio, fin) => {
    setMensaje("");
    setDuracion("");
    setTurno("");
    setBloqueValido(false);

    if (!inicio || !fin) return;

    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fin.split(":").map(Number);

    const totalMin = h2 * 60 + m2 - (h1 * 60 + m1);

    if (totalMin <= 0) {
      setDuracion("⛔ Horario inválido: fin debe ser posterior a inicio");
      return;
    }

    const minMinutos = 50;
    const maxMinutos = 360;

    if (totalMin < minMinutos) {
      setDuracion(`⛔ Duración mínima: ${minMinutos} minutos`);
      return;
    }
    if (totalMin > maxMinutos) {
      setDuracion("⛔ Excede las 6 horas permitidas");
      return;
    }

    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    const texto =
      horas > 0
        ? `${horas} hora${horas > 1 ? "s" : ""}${
            minutos > 0 ? ` ${minutos} min` : ""
          }`
        : `${minutos} min`;

    setDuracion(texto);

    if (h1 < 12) setTurno("Mañana");
    else if (h1 < 19) setTurno("Tarde");
    else setTurno("Noche");

    setBloqueValido(true);
  };

  // Código preview visual
  useEffect(() => {
    const { dia, hora_inicio } = bloque;
    if (!dia || !hora_inicio) {
      setBloque((prev) => ({ ...prev, codigo_bloque: "" }));
      return;
    }

    const prefijo = abreviarDia(dia);
    const letraTurno = obtenerTurnoLetra(hora_inicio);
    const codigoVisual = `${prefijo}-${letraTurno}…`;

    setBloque((prev) => ({ ...prev, codigo_bloque: codigoVisual }));
  }, [bloque.dia, bloque.hora_inicio]);

  // Handler de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nuevo = { ...bloque, [name]: value };

    setBloque(nuevo);

    if (name === "hora_inicio" || name === "hora_fin") {
      calcularDatos(
        name === "hora_inicio" ? value : nuevo.hora_inicio,
        name === "hora_fin" ? value : nuevo.hora_fin
      );
    } else if (name === "dia") {
      calcularDatos(nuevo.hora_inicio, nuevo.hora_fin);
    }

    // MOSTRAR EL CÓDIGO REAL
    if (
      (name === "dia" || name === "hora_inicio") &&
      nuevo.dia &&
      nuevo.hora_inicio
    ) {
      obtenerCodigoSugerido(nuevo.dia, nuevo.hora_inicio);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!bloque.dia || !bloque.hora_inicio || !bloque.hora_fin) {
      setMensaje("⚠️ Completa día, hora inicio y hora fin.");
      return;
    }
    if (!bloqueValido) {
      setMensaje("⚠️ El bloque no es válido. Revisa duración o horas.");
      return;
    }

    // Payload sin estado (backend lo pondrá como Activo)
    const payload = {
      dia: bloque.dia,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
    };

    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/superadmin/bloques-horarios",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMensaje(`✅ Bloque registrado: ${data.codigo_bloque}`);

        // Mostrar el código generado por el backend
        setBloque((prev) => ({
          ...prev,
          codigo_bloque: data.codigo_bloque,
        }));

        // Reiniciar horas y día pero conservar el código generado
        setTimeout(() => {
          setBloque({
            codigo_bloque: "",
            dia: "",
            hora_inicio: "",
            hora_fin: "",
          });
        }, 2000);

        setDuracion("");
        setTurno("");
        setBloqueValido(false);
      } else {
        setMensaje(`❌ ${data.error || "No se pudo registrar el bloque."}`);
      }
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error de conexión con la API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="registrar-horario"
      style={{ maxWidth: 640, margin: "24px auto", padding: 20 }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>
        Registrar Nuevo Bloque Horario
      </h2>

      <form onSubmit={handleSubmit} className="form-horario">
        {/* DÍA */}
        <div className="campo" style={{ marginBottom: 12 }}>
          <label>
            Día de la Semana*:
            <select
              name="dia"
              value={bloque.dia}
              onChange={handleChange}
              aria-required="true"
              style={{ display: "block", width: "100%", marginTop: 6 }}
            >
              <option value="">-- Seleccione día --</option>
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
            </select>
          </label>
        </div>

        {/* HORAS */}
        <div
          className="campo"
          style={{ display: "flex", gap: 12, marginBottom: 8 }}
        >
          <label style={{ flex: 1 }}>
            Hora Inicio*:
            <input
              type="time"
              name="hora_inicio"
              value={bloque.hora_inicio}
              onChange={handleChange}
              aria-required="true"
              min="06:00"
              max="23:00"
              style={{ display: "block", marginTop: 6, width: "100%" }}
            />
            <small style={{ display: "block", marginTop: 6 }}>
              Formato 24h (HH:MM)
            </small>
          </label>

          <label style={{ flex: 1 }}>
            Hora Fin*:
            <input
              type="time"
              name="hora_fin"
              value={bloque.hora_fin}
              onChange={handleChange}
              aria-required="true"
              min="06:30"
              max="23:59"
              style={{ display: "block", marginTop: 6, width: "100%" }}
            />
            <small style={{ display: "block", marginTop: 6 }}>
              Formato 24h (HH:MM)
            </small>
          </label>
        </div>

        {/* CÓDIGO */}
        <div className="campo" style={{ marginBottom: 8 }}>
          <label>
            Código del Bloque:
            <input
              type="text"
              name="codigo_bloque"
              value={bloque.codigo_bloque}
              readOnly
              aria-readonly="true"
              style={{ display: "block", marginTop: 6, width: "100%" }}
            />
            <small style={{ display: "block", marginTop: 6 }}>
              Se genera automáticamente. Ej: LUN-M…
            </small>
          </label>
        </div>

        {/* INFO AUTOMÁTICA */}
        <div
          className="info-automatica"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 10,
            marginBottom: 8,
            padding: 10,
            borderRadius: 8,
            background: "rgba(0,0,0,0.03)",
          }}
        >
          {/*Agregar iconos de box-icons*/}
          <div style={{ flex: 1 }}>
            <strong>Duración:</strong>
            <div>{duracion || "—"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <strong>Turno:</strong>
            <div>{turno || "—"}</div>
          </div>
        </div>

        {/* BOTONES */}
        <div
          className="botones"
          style={{ display: "flex", gap: 12, marginTop: 12 }}
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Ver Lista de horarios
          </button>

          <button
            type="submit"
            disabled={!bloqueValido || loading}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background:
                !bloqueValido || loading
                  ? "linear-gradient(135deg,#9bbffb,#7f9fd9)"
                  : "linear-gradient(135deg,#007aff,#005acc)",
              color: "#fff",
              cursor: !bloqueValido || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Guardando..." : "Guardar Bloque"}
          </button>
        </div>
      </form>

      <p style={{ marginTop: 14 }}>{mensaje}</p>
    </div>
  );
}
