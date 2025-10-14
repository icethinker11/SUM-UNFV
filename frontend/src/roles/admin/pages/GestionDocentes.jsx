import { useEffect, useState } from "react";
import "../styles/GestionDocentes.css";


function GestionDocentes() {
  const [docentes, setDocentes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    contrasena: ""
  });

  useEffect(() => {
    fetch("http://localhost:5000/admin/docentes")
      .then(res => res.json())
      .then(data => setDocentes(data))
      .catch(err => console.error("Error cargando docentes:", err));
  }, []);

  const handleEdit = (docente) => {
    setEditId(docente.usuario_id);
    setFormData({
      nombres: docente.nombres,
      apellidos: docente.apellidos || "",
      correo: docente.correo,
      contrasena: ""
    });
  };

  const handleSave = (id) => {
    fetch(`http://localhost:5000/admin/docentes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(updated => {
        setDocentes(docentes.map(d => (d.usuario_id === id ? updated : d)));
      
        setEditId(null);
      })
      .catch(err => console.error("Error guardando docente:", err));
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/admin/docentes/${id}`, { method: "DELETE" })
      .then(() => setDocentes(docentes.filter(d => d.usuario_id !== id)))
      .catch(err => console.error("Error eliminando docente:", err));
  };

  return (
    <div className="gestion-docentes-container">
      <h2>Gestión de Docentes</h2>
      <table className="gestion-docentes-table">
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
          {docentes.map(docente => (
            <tr key={docente.usuario_id}>
              <td>{docente.usuario_id}</td>
              <td>
                {editId === docente.usuario_id ? (
                  <input
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  />
                ) : (
                  docente.nombres
                )}
              </td>
              <td>
                {editId === docente.usuario_id ? (
                  <input
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  />
                ) : (
                  docente.apellidos
                )}
              </td>
              <td>
                {editId === docente.usuario_id ? (
                  <input
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  />
                ) : (
                  docente.correo
                )}
              </td>
              <td>
                {editId === docente.usuario_id ? (
                  <input
                    type="password"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  />
                ) : (
                  "******"
                )}
              </td>
              <td>
                {editId === docente.usuario_id ? (
                  <button onClick={() => handleSave(docente.usuario_id)}>Guardar</button>
                ) : (
                  <button onClick={() => handleEdit(docente)}>Editar</button>
                )}
                <button onClick={() => handleDelete(docente.usuario_id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GestionDocentes;
