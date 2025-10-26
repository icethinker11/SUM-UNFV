import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/gest-admin.css";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

const GestionAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [formaciones, setFormaciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [formOriginal, setFormOriginal] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  useEffect(() => {
    obtenerAdmins();
    obtenerEscuelas();
    obtenerDistritos();
    obtenerFormaciones();
    obtenerEspecialidades();
  }, []);

  // =============================
  // 📋 Obtener datos del backend
  // =============================

  const obtenerAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:5000/superadmin/admins/admins");

      // Normalizamos los nombres de las claves
      const lista = (res.data.admins || []).map((a) => ({
        usuario_id: a.usuario_id,
        nombres: a.nombres,
        apellidos: a.apellidos,
        dni: a.dni,
        telefono: a.telefono,
        direccion_detalle: a.direccion_detalle,
        fecha_nacimiento: a.fecha_nacimiento,
        correo: a.correo,
        estado: a.estado,
        nombre_distrito: a.nombre_distrito || a.distrito || "",
        formacion: a.nombre_formacion || a.formacion || "",
        cargo: a.cargo || "Administrador",
        escuela: a.nombre_escuela || a.escuela || "",
        distrito_id: a.distrito_id,
        id_formacion: a.id_formacion,
        id_especialidad: a.id_especialidad,
        escuela_id: a.escuela_id,
      }));

      setAdmins(lista);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
      mostrarMensaje("Error al cargar los administradores ❌", "error");
    }
  };

  const obtenerEscuelas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/superadmin/academico/escuelas");
      setEscuelas(res.data.escuelas || []);
    } catch (error) {
      console.error("Error al cargar escuelas:", error);
    }
  };

  const obtenerDistritos = async () => {
    try {
      const res = await axios.get("http://localhost:5000/superadmin/ubicaciones/distritos");
      setDistritos(res.data.distritos || []);
    } catch (error) {
      console.error("Error al cargar distritos:", error);
    }
  };

  const obtenerFormaciones = async () => {
    try {
      const res = await axios.get("http://localhost:5000/superadmin/academico/formaciones");
      setFormaciones(res.data.formaciones || []);
    } catch (error) {
      console.error("Error al cargar formaciones:", error);
    }
  };

  const obtenerEspecialidades = async () => {
    try {
      const res = await axios.get("http://localhost:5000/superadmin/academico/especialidades");
      setEspecialidades(res.data.especialidades || []);
    } catch (error) {
      console.error("Error al cargar especialidades:", error);
    }
  };

  // =============================
  // 🧠 Utilidades
  // =============================

  const mostrarMensaje = (texto, tipo) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(""), 4000);
  };

  const ajustarFechaLocal = (fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    const fechaLocal = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
    return fechaLocal.toISOString().split("T")[0];
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getUTCDate()).padStart(2, "0");
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // =============================
  // ⚙️ CRUD - Editar / Guardar / Eliminar
  // =============================

  const iniciarEdicion = (admin) => {
    const [apellido_paterno = "", apellido_materno = ""] = (admin.apellidos || "").split(" ");
    const datos = {
      ...admin,
      apellido_paterno,
      apellido_materno,
      direccion_detalle: admin.direccion_detalle || "",
      distrito_id: admin.distrito_id || "",
      fecha_nacimiento: ajustarFechaLocal(admin.fecha_nacimiento),
      id_formacion: admin.id_formacion || "",
      id_especialidad: admin.id_especialidad || "",
    };
    setEditando(admin.usuario_id);
    setForm(datos);
    setFormOriginal(datos);
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setForm({});
  };

  const eliminarAdmin = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este administrador?")) return;
    try {
      await axios.delete(`http://localhost:5000/superadmin/admins/admins/${id}`);
      mostrarMensaje("Administrador eliminado correctamente ✅", "success");

      setTimeout(() => {
        obtenerAdmins();
      }, 400);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al eliminar el administrador ❌", "error");
    }
  };

  // ✅ Verificación de cambios
  const hayCambios = () => JSON.stringify(form) !== JSON.stringify(formOriginal);

  // ✅ Validaciones
  const validarCampos = () => {
    const errores = [];

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    const sinSentido = /^(.)\1+$/;

    const validarNombre = (valor, campo) => {
      if (!valor || !soloLetras.test(valor.trim())) {
        errores.push(`El campo "${campo}" solo debe contener letras y espacios.`);
      } else if (valor.trim().length < 2) {
        errores.push(`El campo "${campo}" debe tener al menos 2 caracteres.`);
      } else if (sinSentido.test(valor.trim().toLowerCase())) {
        errores.push(`El campo "${campo}" no puede contener letras repetidas sin sentido.`);
      }
    };

    validarNombre(form.nombres, "Nombres");
    validarNombre(form.apellido_paterno, "Apellido paterno");
    validarNombre(form.apellido_materno, "Apellido materno");

    if (!form.dni || !/^\d{8}$/.test(form.dni)) {
      errores.push("El DNI debe tener exactamente 8 dígitos numéricos.");
    }

    if (!form.telefono || !/^\d{9}$/.test(form.telefono)) {
      errores.push("El teléfono debe tener exactamente 9 dígitos numéricos.");
    }

    if (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      errores.push("El correo no tiene un formato válido.");
    }

    return errores;
  };

  const capitalizar = (texto) =>
    texto
      ? texto
          .toLowerCase()
          .trim()
          .replace(/\b\w/g, (letra) => letra.toUpperCase())
      : "";

  const guardarCambios = async (id) => {
    if (!hayCambios()) {
      mostrarMensaje("No se detectaron cambios para guardar.", "error");
      return;
    }

    const errores = validarCampos();
    if (errores.length > 0) {
      mostrarMensaje(errores.join(" "), "error");
      return;
    }

    try {
      const fechaUTC = form.fecha_nacimiento
        ? new Date(form.fecha_nacimiento).toISOString().split("T")[0]
        : null;

      const apellidosCompletos = `${capitalizar(form.apellido_paterno)} ${capitalizar(
        form.apellido_materno
      )}`.trim();

      const payload = {
        nombres: capitalizar(form.nombres),
        apellidos: apellidosCompletos,
        dni: form.dni,
        telefono: form.telefono,
        fecha_nacimiento: fechaUTC,
        correo: form.correo,
        estado: form.estado,
        direccion_detalle: form.direccion_detalle,
        distrito_id: form.distrito_id || null,
        id_formacion: form.id_formacion || null,
        id_especialidad: form.id_especialidad || null,
        experiencia_lab: form.experiencia_lab || null,
        escuela_id: form.escuela_id,
      };

      // ✅ Debe ser:
      await axios.put(`http://localhost:5000/superadmin/admins/admins/${id}`, payload);
      mostrarMensaje("Administrador actualizado correctamente ✅", "success");
      cancelarEdicion();

      setTimeout(() => {
        obtenerAdmins();
      }, 500);
    } catch (error) {
      console.error("Error al actualizar:", error);
      mostrarMensaje("Error al actualizar administrador ❌", "error");
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // =============================
  // 🧩 Renderizado
  // =============================

  return (
    <div className="gestion-admin">
      <div className="header-admin">
        <h2>Gestión de Administradores</h2>
      </div>

      {mensaje && (
        <div className={tipoMensaje === "success" ? "alert-success" : "alert-error"}>
          {mensaje}
        </div>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombres</th>
              <th>Apellido Paterno</th>
              <th>Apellido Materno</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Distrito</th>
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
                    {/* Campos en edición */}
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
                        name="apellido_paterno"
                        value={form.apellido_paterno || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="apellido_materno"
                        value={form.apellido_materno || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input type="text" name="dni" value={form.dni || ""} onChange={handleChange} />
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
                        name="direccion_detalle"
                        value={form.direccion_detalle || ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <select
                        name="distrito_id"
                        value={form.distrito_id || ""}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione</option>
                        {distritos.map((d) => (
                          <option key={d.distrito_id} value={d.distrito_id}>
                            {d.nombre_distrito}
                          </option>
                        ))}
                      </select>
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
                        name="id_formacion"
                        value={form.id_formacion || ""}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione</option>
                        {formaciones.map((f) => (
                          <option key={f.id_formacion} value={f.id_formacion}>
                            {f.nombre_formacion}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        name="id_especialidad"
                        value={form.id_especialidad || ""}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione</option>
                        {especialidades.map((e) => (
                          <option key={e.id_especialidad} value={e.id_especialidad}>
                            {e.nombre_especialidad}
                          </option>
                        ))}
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
                      <select name="estado" value={form.estado || ""} onChange={handleChange}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </td>
                    <td className="actions">
                      <button className="btn-save" onClick={() => guardarCambios(admin.usuario_id)}>
                        <FaSave />
                      </button>
                      <button className="btn-cancel" onClick={cancelarEdicion}>
                        <FaTimes />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* Campos en vista */}
                    <td>{admin.nombres}</td>
                    <td>{(admin.apellidos || "").split(" ")[0] || ""}</td>
                    <td>{(admin.apellidos || "").split(" ")[1] || ""}</td>
                    <td>{admin.dni}</td>
                    <td>{admin.telefono}</td>
                    <td>{admin.direccion_detalle}</td>
                    <td>{admin.nombre_distrito}</td>
                    <td>{formatearFecha(admin.fecha_nacimiento)}</td>
                    <td>{admin.formacion}</td>
                    <td>{admin.cargo}</td>
                    <td>{admin.escuela}</td>
                    <td>{admin.correo}</td>
                    <td
                      style={{
                        color: admin.estado === "Activo" ? "#16a34a" : "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      {admin.estado}
                    </td>
                    <td className="actions">
                      <button className="btn-edit" onClick={() => iniciarEdicion(admin)}>
                        <FaEdit />
                      </button>
                      <button className="btn-delete" onClick={() => eliminarAdmin(admin.usuario_id)}>
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