import { useState, useEffect } from "react";
import "../styles/GestionAlumnos.css";

function GestionAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    contrasena: "",
  });

  // 🔹 función central para cargar alumnos
  const fetchAlumnos = () => {
    fetch("http://localhost:5000/admin/alumnos")
      .then((res) => res.json())
      .then((data) => setAlumnos(data))
      .catch((err) => console.error("Error cargando alumnos:", err));
  };

  useEffect(() => {
    fetchAlumnos(); // carga inicial
  }, []);

  const handleEdit = (alumno) => {
    setEditId(alumno.usuario_id);
    setFormData({
      nombres: alumno.nombres,
      apellidos: alumno.apellidos || "",
      correo: alumno.correo,
      contrasena: "",
    });
  };

  const handleSave = (id) => {
    fetch(`http://localhost:5000/admin/alumnos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then(() => {
        fetchAlumnos(); // 🔹 refresca la tabla
        setEditId(null);
      })
      .catch((err) => console.error("Error guardando alumno:", err));
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/admin/alumnos/${id}`, { method: "DELETE" })
      .then(() => {
        fetchAlumnos(); // 🔹 refresca la tabla
      })
      .catch((err) => console.error("Error eliminando alumno:", err));
  };

  return (
    <div className="gestion-alumnos-container">
      <h2>Gestión de Alumnos</h2>
      <table className="gestion-alumnos-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Correo</th>
            <th>Contraseña</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((alumno) => (
            <tr key={alumno.usuario_id}>
              <td>{alumno.usuario_id}</td>
              <td>
                {editId === alumno.usuario_id ? (
                  <input
                    value={formData.nombres}
                    onChange={(e) =>
                      setFormData({ ...formData, nombres: e.target.value })
                    }
                  />
                ) : (
                  alumno.nombres
                )}
              </td>
              <td>
                {editId === alumno.usuario_id ? (
                  <input
                    value={formData.apellidos}
                    onChange={(e) =>
                      setFormData({ ...formData, apellidos: e.target.value })
                    }
                  />
                ) : (
                  alumno.apellidos
                )}
              </td>
              <td>
                {editId === alumno.usuario_id ? (
                  <input
                    value={formData.correo}
                    onChange={(e) =>
                      setFormData({ ...formData, correo: e.target.value })
                    }
                  />
                ) : (
                  alumno.correo
                )}
              </td>
              <td>
                {editId === alumno.usuario_id ? (
                  <input
                    type="password"
                    value={formData.contrasena}
                    onChange={(e) =>
                      setFormData({ ...formData, contrasena: e.target.value })
                    }
                  />
                ) : (
                  "******"
                )}
              </td>
              <td>
                {editId === alumno.usuario_id ? (
                  <button
                    className="save-btn"
                    onClick={() => handleSave(alumno.usuario_id)}
                  >
                    Guardar
                  </button>
                ) : (
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(alumno)}
                  >
                    Editar
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(alumno.usuario_id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GestionAlumnos;
