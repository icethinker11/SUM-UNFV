import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/gest-admin.css";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

const GestionAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  useEffect(() => {
    obtenerAdmins();
    obtenerEscuelas();
  }, []);

  const obtenerAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:5000/superadmin/admins");
      setAdmins(res.data.admins || []);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
      setMensaje("Error al cargar los administradores");
      setTipoMensaje("error");
    }
  };

  const obtenerEscuelas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/superadmin/escuelas");
      setEscuelas(res.data.escuelas || []);
    } catch (error) {
      console.error("Error al cargar escuelas:", error);
    }
  };

  const eliminarAdmin = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este administrador?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/superadmin/admins/${id}`);
      setMensaje("Administrador eliminado correctamente ✅");
      setTipoMensaje("success");
      obtenerAdmins();
    } catch (error) {
      console.error(error);
      setMensaje("Error al eliminar el administrador ❌");
      setTipoMensaje("error");
    }
  };

  const iniciarEdicion = (admin) => {
    setEditando(admin.usuario_id);
    setForm({
      ...admin,
      fecha_nacimiento: admin.fecha_nacimiento || "",
    });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setForm({});
  };

  const guardarCambios = async (id) => {
    try {
      await axios.put(`http://localhost:5000/superadmin/admins/${id}`, {
        ...form,
      });
      setMensaje("Administrador actualizado correctamente ✅");
      setTipoMensaje("success");
      cancelarEdicion();
      obtenerAdmins();
    } catch (error) {
      console.error(error);
      setMensaje("Error al actualizar administrador ❌");
      setTipoMensaje("error");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    const [year, month, day] = fechaISO.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="gestion-admin">
      <div className="header-admin">
        <h2>Gestión de Administradores</h2>
      </div>

      {mensaje && (
        <div
          className={
            tipoMensaje === "success" ? "alert-success" : "alert-error"
          }
        >
          {mensaje}
        </div>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Fecha Nacimiento</th>
              <th>Formación</th>
              <th>Cargo</th>
              <th>Escuela</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.usuario_id}>
                {editando === admin.usuario_id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        name="nombres"
                        value={form.nombres || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="apellidos"
                        value={form.apellidos || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="dni"
                        value={form.dni || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="telefono"
                        value={form.telefono || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="direccion"
                        value={form.direccion || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="fecha_nacimiento"
                        value={form.fecha_nacimiento || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <select
                        name="formacion"
                        value={form.formacion || ""}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione</option>
                        <option value="Licenciado">Licenciado</option>
                        <option value="Ingeniero">Ingeniero</option>
                        <option value="Magíster">Magíster</option>
                        <option value="Doctor">Doctor</option>
                        <option value="Técnico">Técnico</option>
                      </select>
                    </td>
                    <td>
                      <select
                        name="cargo"
                        value={form.cargo || ""}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione</option>
                        <option value="Coordinador">Coordinador</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Administrador">Administrador</option>
                      </select>
                    </td>
                    <td>
                      <select
                        name="escuela_id"
                        value={form.escuela_id || ""}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione</option>
                        {escuelas.map((esc) => (
                          <option key={esc.escuela_id} value={esc.escuela_id}>
                            {esc.nombre_escuela}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="correo"
                        value={form.correo || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <select
                        name="estado"
                        value={form.estado || ""}
                        onChange={handleChange}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-save"
                        onClick={() => guardarCambios(admin.usuario_id)}
                      >
                        <FaSave />
                      </button>
                      <button className="btn-cancel" onClick={cancelarEdicion}>
                        <FaTimes />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{admin.nombres}</td>
                    <td>{admin.apellidos}</td>
                    <td>{admin.dni}</td>
                    <td>{admin.telefono}</td>
                    <td>{admin.direccion}</td>
                    <td>{formatearFecha(admin.fecha_nacimiento)}</td>
                    <td>{admin.formacion}</td>
                    <td>{admin.cargo}</td>
                    <td>{admin.nombre_escuela}</td>
                    <td>{admin.correo}</td>
                    <td
                      style={{
                        color:
                          admin.estado === "Activo" ? "#16a34a" : "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      {admin.estado}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => iniciarEdicion(admin)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => eliminarAdmin(admin.usuario_id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionAdmins;
