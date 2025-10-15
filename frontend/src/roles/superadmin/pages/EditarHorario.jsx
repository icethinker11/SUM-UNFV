import React, { useEffect, useState } from "react";
import "../styles/editar-horario.css";

export default function EditarHorario() {
  const [bloques, setBloques] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  // Formulario
  const [form, setForm] = useState({
    bloque_id: "",
    codigo_bloque: "",
    dia: "",
    hora_inicio: "",
    hora_fin: "",
    estado: "Activo",
  });

  // Calculados
  const [duracion, setDuracion] = useState("");
  const [turno, setTurno] = useState("");

  // ---------- helpers ----------
  const abreviarDia = (dia) => {
    const map = {
      Lunes: "LUN",
      Martes: "MAR",
      "Miércoles": "MIE",
      Jueves: "JUE",
      Viernes: "VIE",
      Sábado: "SAB",
      Domingo: "DOM",
    };
    return map[dia] || dia?.slice(0, 3).toUpperCase() || "";
  };

  const obtenerTurnoLetra = (horaInicio) => {
    if (!horaInicio) return "";
    const [h] = horaInicio.split(":").map(Number);
    if (h < 12) return "M";
    if (h < 19) return "T";
    return "N";
  };

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
      setTurno("");
      return;
    }
    if (totalMin > 360) {
      setDuracion("⛔ Excede las 6 horas permitidas");
      setTurno("");
      return;
    }

    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    setDuracion(
      horas > 0
        ? `${horas} hora${horas > 1 ? "s" : ""}${minutos > 0 ? ` ${minutos} min` : ""}`
        : `${minutos} min`
    );

    if (h1 < 12) setTurno("Mañana");
    else if (h1 < 19) setTurno("Tarde");
    else setTurno("Noche");
  };

  // ---------- cargar lista ----------
  useEffect(() => {
    const fetchBloques = async () => {
      try {
        setCargando(true);
        // Ajusta la url si tu backend está en otro puerto/ruta
        const res = await fetch("http://localhost:5000/superadmin/bloques-horarios");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al obtener bloques.");
        setBloques(data);
      } catch (err) {
        console.error(err);
        setMensaje("❌ Error al obtener bloques horarios.");
      } finally {
        setCargando(false);
      }
    };
    fetchBloques();
  }, []);

  // ---------- al seleccionar uno ----------
  const seleccionarBloque = (b) => {
    setSeleccionado(b.bloque_id);
    // Ajuste de nombres entre backend y form
    setForm({
      bloque_id: b.bloque_id,
      codigo_bloque: b.codigo_bloque || "",
      dia: b.dia || "",
      hora_inicio: b.hora_inicio ? b.hora_inicio.slice(0,5) : "",
      hora_fin: b.hora_fin ? b.hora_fin.slice(0,5) : "",
      estado: b.estado || "Activo",
    });
    calcularDatos(b.hora_inicio ? b.hora_inicio.slice(0,5) : "", b.hora_fin ? b.hora_fin.slice(0,5) : "");
  };

  // ---------- manejar cambios en form ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nuevo = { ...form, [name]: value };
    setForm(nuevo);

    if (name === "hora_inicio" || name === "hora_fin") {
      const inicio = name === "hora_inicio" ? value : nuevo.hora_inicio;
      const fin = name === "hora_fin" ? value : nuevo.hora_fin;
      calcularDatos(inicio, fin);
    }
  };

  // ---------- guardar cambios (PUT) ----------
  const handleGuardar = async (e) => {
    e.preventDefault();
    setMensaje("");

    // validaciones front
    if (!form.dia || !form.hora_inicio || !form.hora_fin) {
      setMensaje("⚠️ Completa día, hora inicio y hora fin.");
      return;
    }
    if (duracion.startsWith("⛔")) {
      setMensaje("⚠️ Corrige la duración del bloque.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/superadmin/bloques-horarios/${form.bloque_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dia: form.dia,
            hora_inicio: form.hora_inicio,
            hora_fin: form.hora_fin,
            estado: form.estado,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setMensaje("❌ " + (data.error || "Error al editar."));
        return;
      }

      // Actualizar lista localmente: reemplazar bloque editado
      setBloques((prev) =>
        prev.map((b) =>
          b.bloque_id === form.bloque_id
            ? {
                ...b,
                dia: form.dia,
                hora_inicio: form.hora_inicio,
                hora_fin: form.hora_fin,
                estado: form.estado,
                codigo_bloque: data.codigo_bloque || form.codigo_bloque,
              }
            : b
        )
      );

      setMensaje("✅ Bloque actualizado correctamente.");
      // actualizar seleccionado con nuevo código si backend devolvió uno
      setForm((prev) => ({ ...prev, codigo_bloque: data.codigo_bloque || prev.codigo_bloque }));
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error de conexión al editar.");
    }
  };

  // ---------- cancelar edición ----------
  const handleCancelar = () => {
    setSeleccionado(null);
    setForm({
      bloque_id: "",
      codigo_bloque: "",
      dia: "",
      hora_inicio: "",
      hora_fin: "",
      estado: "Activo",
    });
    setDuracion("");
    setTurno("");
    setMensaje("");
  };

  if (cargando) return <div className="editar-cargando">Cargando bloques...</div>;

  return (
    <div className="editar-horario-root">
      <h2>✏️ Editar Bloque Horario</h2>

      <div className="editar-layout">
        {/* ----- Lista de bloques (lado izquierdo) ----- */}
        <div className="editar-lista">
          <h3>Selecciona un bloque</h3>
          {bloques.length === 0 ? (
            <p>No hay bloques registrados.</p>
          ) : (
            <div className="lista-scroll">
              {bloques.map((b) => {
                const selectedClass = seleccionado === b.bloque_id ? "item-seleccionado" : "";
                return (
                  <div
                    key={b.bloque_id}
                    className={`bloque-item ${selectedClass}`}
                    onClick={() => seleccionarBloque(b)}
                  >
                    <div className="item-line">
                      <span className="codigo">{b.codigo_bloque}</span>
                      <span className="dia">{b.dia}</span>
                    </div>
                    <div className="item-line small">
                      {b.hora_inicio?.slice(0,5)} - {b.hora_fin?.slice(0,5)} • {b.estado}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ----- Formulario de edición (lado derecho) ----- */}
        <div className="editar-form">
          {!seleccionado ? (
            <div className="mensaje-seleccionar">Selecciona un bloque a la izquierda para editarlo.</div>
          ) : (
            <form onSubmit={handleGuardar}>
              <label>
                Código:
                <input type="text" name="codigo_bloque" value={form.codigo_bloque} readOnly />
              </label>

              <label>
                Día*:
                <select name="dia" value={form.dia} onChange={handleChange} required>
                  <option value="">-- Seleccione día --</option>
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </label>

              <label>
                Hora Inicio*:
                <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} required />
                <small>Formato 24h (HH:MM)</small>
              </label>

              <label>
                Hora Fin*:
                <input type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange} required />
                <small>Formato 24h (HH:MM)</small>
              </label>

              <div className="info-automatica">
                <p>Duración: {duracion || "—"}</p>
                <p>Turno: {turno || "—"}</p>
              </div>

              <label>
                Estado*:
                <select name="estado" value={form.estado} onChange={handleChange}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </label>

              <div className="botones-editar">
                <button type="button" className="btn-cancelar" onClick={handleCancelar}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">Guardar Cambios</button>
              </div>

              {mensaje && <p className="mensaje">{mensaje}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

