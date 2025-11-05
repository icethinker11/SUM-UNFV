import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/Perfil.css";

function PerfilDocente({ usuarioId }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});

  // ✅ Cargar datos del docente
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        if (!usuarioId) {
          console.error("❌ usuarioId no definido");
          toast.error("No se pudo identificar al docente.");
          setLoading(false);
          return;
        }

        const res = await fetch(`http://127.0.0.1:5000/api/perfil/${usuarioId}`);
        if (!res.ok) throw new Error("Error al obtener el perfil.");

        const data = await res.json();
        console.log("✅ Perfil cargado:", data);

        setPerfil(data);
        setFormData(data);
      } catch (error) {
        console.error("❌ Error al cargar perfil:", error);
        toast.error("No se pudo cargar el perfil del docente.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [usuarioId]);

  // 🧾 Manejo de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 💾 Guardar cambios (PUT al backend)
  const handleGuardar = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/perfil/${usuarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al actualizar el perfil.");
        return;
      }

      toast.success("Perfil actualizado correctamente ✅");
      setPerfil(formData);
      setEditando(false);
    } catch (error) {
      console.error("❌ Error al actualizar perfil:", error);
      toast.error("No se pudo guardar los cambios.");
    }
  };

  // 🟦 Obtener iniciales para el avatar
  const obtenerIniciales = () => {
    if (!perfil) return "";
    const nombres = perfil.nombres ? perfil.nombres.split(" ")[0] : "";
    const apellidos = perfil.apellidos ? perfil.apellidos.split(" ")[0] : "";
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  if (loading) return <p className="perfil-docente-loader">Cargando perfil...</p>;
  if (!perfil) return <p className="perfil-docente-error">No se encontró información del perfil.</p>;

  return (
    <div className="perfil-docente-container">
      <div className="perfil-docente-header">
        <div className="perfil-docente-avatar">
          <span>{obtenerIniciales()}</span>
        </div>
        <h2 className="perfil-docente-titulo">👤 Mi Perfil Docente</h2>
      </div>

      <div className="perfil-docente-grid">
        <div>
          <label className="perfil-docente-label">Nombres:</label>
          <input
            type="text"
            name="nombres"
            value={formData.nombres || ""}
            onChange={handleChange}
            disabled={!editando}
            className="perfil-docente-input"
          />
        </div>

        <div>
          <label className="perfil-docente-label">Apellidos:</label>
          <input
            type="text"
            name="apellidos"
            value={formData.apellidos || ""}
            onChange={handleChange}
            disabled={!editando}
            className="perfil-docente-input"
          />
        </div>

        <div>
          <label className="perfil-docente-label">Correo:</label>
          <input
            type="email"
            name="correo"
            value={formData.correo || ""}
            disabled
            className="perfil-docente-input perfil-docente-disabled"
          />
        </div>

        <div>
          <label className="perfil-docente-label">Teléfono:</label>
          <input
            type="text"
            name="telefono"
            value={formData.telefono || ""}
            onChange={handleChange}
            disabled={!editando}
            className="perfil-docente-input"
          />
        </div>

        <div>
          <label className="perfil-docente-label">DNI:</label>
          <input
            type="text"
            name="dni"
            value={formData.dni || ""}
            disabled
            className="perfil-docente-input perfil-docente-disabled"
          />
        </div>

        <div>
          <label className="perfil-docente-label">Fecha de nacimiento:</label>
          <input
            type="date"
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento || ""}
            onChange={handleChange}
            disabled={!editando}
            className="perfil-docente-input"
          />
        </div>

        <div className="col-span-2">
          <label className="perfil-docente-label">Dirección:</label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion || ""}
            onChange={handleChange}
            disabled={!editando}
            className="perfil-docente-input"
          />
        </div>

        <div className="col-span-2">
          <label className="perfil-docente-label">Distrito:</label>
          <input
            type="text"
            name="distrito"
            value={formData.distrito || ""}
            disabled
            className="perfil-docente-input perfil-docente-disabled"
          />
        </div>

        <div className="col-span-2">
          <label className="perfil-docente-label">Escuela:</label>
          <input
            type="text"
            name="escuela"
            value={formData.escuela || ""}
            disabled
            className="perfil-docente-input perfil-docente-disabled"
          />
        </div>
      </div>

      <div className="perfil-docente-botones">
        {editando ? (
          <>
            <button
              onClick={handleGuardar}
              className="perfil-docente-btn perfil-docente-btn-guardar"
            >
              💾 Guardar
            </button>
            <button
              onClick={() => {
                setFormData(perfil);
                setEditando(false);
              }}
              className="perfil-docente-btn perfil-docente-btn-cancelar"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="perfil-docente-btn perfil-docente-btn-editar"
          >
            ✏️ Editar Perfil
          </button>
        )}
      </div>
    </div>
  );
}

export default PerfilDocente;
