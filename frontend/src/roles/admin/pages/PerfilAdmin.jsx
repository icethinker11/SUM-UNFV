import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import "../styles/perfil-admin.css";

const BASE_URL = "http://localhost:5000/admin";

// ==========================================================
// Componente hijo para cambio de contraseña
// ==========================================================
const ChangePasswordForm = ({ usuarioId, onPasswordChange }) => {
    const [passwords, setPasswords] = useState({
        contrasena_actual: "",
        contrasena_nueva: "",
        confirmar_contrasena: ""
    });
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje("");
        setError("");

        if (passwords.contrasena_nueva !== passwords.confirmar_contrasena) {
            return setError("Las contraseñas nuevas no coinciden.");
        }
        if (passwords.contrasena_nueva.length < 8) {
            return setError("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        try {
            const response = await axios.put(
                `${BASE_URL}/mi-perfil/${usuarioId}/cambiar-contrasena`,
                passwords
            );
            setMensaje(response.data.mensaje);
            setPasswords({
                contrasena_actual: "",
                contrasena_nueva: "",
                confirmar_contrasena: ""
            });
            onPasswordChange(); // 🔔 Notificar al componente padre
        } catch (err) {
            console.error("❌ Error al cambiar contraseña:", err.response?.data);
            setError(err.response?.data?.error || "Error al cambiar la contraseña.");
        }
    };

    return (
        <div className="section-card">
            <h3>🔒 Cambiar Contraseña</h3>
            {mensaje && <div className="alert success">{mensaje}</div>}
            {error && <div className="alert error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    name="contrasena_actual"
                    value={passwords.contrasena_actual}
                    onChange={handleChange}
                    placeholder="Contraseña Actual"
                    required
                />
                <input
                    type="password"
                    name="contrasena_nueva"
                    value={passwords.contrasena_nueva}
                    onChange={handleChange}
                    placeholder="Nueva Contraseña (mín. 8 caracteres)"
                    required
                />
                <input
                    type="password"
                    name="confirmar_contrasena"
                    value={passwords.confirmar_contrasena}
                    onChange={handleChange}
                    placeholder="Confirmar Nueva Contraseña"
                    required
                />
                <button type="submit" className="btn-change-pass">
                    Actualizar Contraseña
                </button>
            </form>
        </div>
    );
};

// ==========================================================
// Componente principal de Perfil
// ==========================================================
function PerfilAdmin({ usuarioId }) {
    const [perfilData, setPerfilData] = useState({});
    const [formData, setFormData] = useState({
        telefono: "",
        direccion_detalle: "",
        distrito_id: ""
    });

    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState({
        departamento_id: "",
        provincia_id: "",
    });

    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);
    const [primerLogin, setPrimerLogin] = useState(false); // 🟢 NUEVO

    // ==========================================================
    // 1️⃣ Cargar datos iniciales
    // ==========================================================
    const cargarPerfil = useCallback(async () => {
        if (!usuarioId) return;
        setCargando(true);
        setError("");

        try {
            const [resPerfil, resDptos] = await Promise.all([
                axios.get(`${BASE_URL}/mi-perfil/${usuarioId}`),
                axios.get(`http://localhost:5000/superadmin/ubicaciones/departamentos-geo`)
            ]);

            const data = resPerfil.data;
            setPerfilData(data);

            // 🟢 Control de primer login
            const esPrimerLogin = data.primer_login || false;
            setPrimerLogin(esPrimerLogin);

            if (esPrimerLogin) {
                setMensaje("⚠️ Bienvenido, por favor cambia tu contraseña generada antes de continuar.");
            } else {
                setMensaje("");
            }

            setFormData({
                telefono: data.telefono || "",
                direccion_detalle: data.direccion_detalle || "",
                distrito_id: data.id_distrito || ""
            });

            setUbicacionSeleccionada({
                departamento_id: data.departamento_id || "",
                provincia_id: data.provincia_id || "",
            });

            setDepartamentos(resDptos.data.departamentos || []);
        } catch (err) {
            console.error("❌ Error al cargar perfil:", err);
            setError(err.response?.data?.error || "Error al cargar datos del perfil.");
        } finally {
            setCargando(false);
        }
    }, [usuarioId]);

    useEffect(() => {
        cargarPerfil();
    }, [cargarPerfil]);

    // ==========================================================
    // 2️⃣ Lógica de ubicaciones (departamentos / provincias / distritos)
    // ==========================================================
    useEffect(() => {
        const { departamento_id } = ubicacionSeleccionada;
        if (departamento_id) {
            axios.get(`http://localhost:5000/superadmin/ubicaciones/provincias/${departamento_id}`)
                .then(res => setProvincias(res.data.provincias || []))
                .catch(err => console.error("Error cargando provincias", err));
        } else {
            setProvincias([]);
        }
    }, [ubicacionSeleccionada.departamento_id]);

    useEffect(() => {
        const { provincia_id } = ubicacionSeleccionada;
        if (provincia_id) {
            axios.get(`http://localhost:5000/superadmin/ubicaciones/distritos/${provincia_id}`)
                .then(res => setDistritos(res.data.distritos || []))
                .catch(err => console.error("Error cargando distritos", err));
        } else {
            setDistritos([]);
        }
    }, [ubicacionSeleccionada.provincia_id]);

    // ==========================================================
    // 3️⃣ Manejo de formularios
    // ==========================================================
    const handleFormChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUbicacionChange = (e) => {
        const { name, value } = e.target;
        setUbicacionSeleccionada((prev) => ({ ...prev, [name]: value }));

        if (name === "departamento_id") {
            setUbicacionSeleccionada(prev => ({ ...prev, provincia_id: "" }));
            setFormData(prev => ({ ...prev, distrito_id: "" }));
        }
        if (name === "provincia_id") {
            setFormData(prev => ({ ...prev, distrito_id: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje("");
        setError("");

        if (primerLogin) {
            return setError("❌ Debes cambiar tu contraseña antes de modificar el perfil.");
        }

        if (!formData.distrito_id) {
            return setError("Debe seleccionar un distrito.");
        }

        try {
            const response = await axios.put(`${BASE_URL}/mi-perfil/${usuarioId}`, formData);
            setMensaje(response.data.mensaje);
            cargarPerfil();
        } catch (err) {
            console.error("❌ Error al modificar perfil:", err.response?.data);
            setError(err.response?.data?.error || "Error al actualizar la información.");
        }
    };

    // 🔐 Cuando cambia la contraseña, desbloquear acceso
    const handlePasswordChangeSuccess = async () => {
        try {
            await axios.put(`${BASE_URL}/mi-perfil/${usuarioId}/marcar-login`); // endpoint backend que pone primer_login = false
            setPrimerLogin(false);
            setMensaje("✅ Contraseña actualizada. Ahora puedes modificar tu perfil.");
        } catch {
            setMensaje("✅ Contraseña actualizada, pero ocurrió un error al actualizar el estado del login.");
        }
    };

    if (cargando) {
        return (
            <div className="perfil-container">
                <div className="loading-message">Cargando perfil... ⏳</div>
            </div>
        );
    }

    // ==========================================================
    // 4️⃣ Renderizado
    // ==========================================================
    return (
        <div className="perfil-container">
            <div className="perfil-card">
                <h2>Mi Perfil de Administrador</h2>

                {primerLogin && (
                    <div className="alert warning large-alert">
                        ⚠️ **¡Atención!** Este es tu **primer inicio de sesión**.  
                        Debes **cambiar tu contraseña generada** antes de continuar.
                    </div>
                )}

                {mensaje && (
                    <div className={`alert ${mensaje.includes("✅") ? "success" : "info"}`}>
                        {mensaje}
                    </div>
                )}
                {error && <div className="alert error">{error}</div>}

                <div className="perfil-content">
                    <div className="info-column">
                        <h3>Información General</h3>
                        <div className="info-item">
                            <label>Correo Institucional:</label>
                            <p>{perfilData.correo_institucional}</p>
                        </div>
                        <div className="info-item">
                            <label>Nombre Completo:</label>
                            <p>{perfilData.nombres} {perfilData.apellidos}</p>
                        </div>
                        <div className="info-item">
                            <label>DNI:</label>
                            <p>{perfilData.dni}</p>
                        </div>
                        <div className="info-item">
                            <label>Fecha Nacimiento:</label>
                            <p>{perfilData.fecha_nacimiento ? new Date(perfilData.fecha_nacimiento).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="info-item">
                            <label>Formación/Cargo:</label>
                            <p>{perfilData.nombre_formacion} / {perfilData.nombre_especialidad}</p>
                        </div>
                        <div className="info-item">
                            <label>Escuela/Facultad:</label>
                            <p>{perfilData.nombre_escuela} ({perfilData.facultad})</p>
                        </div>
                    </div>

                    <div className="edit-column">
                        <ChangePasswordForm 
                            usuarioId={usuarioId} 
                            onPasswordChange={handlePasswordChangeSuccess} 
                        />

                        <div className="section-card">
                            <h3>📞 Contacto y Ubicación</h3>
                            <form onSubmit={handleSubmit}>
                                <label htmlFor="telefono">Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    id="telefono"
                                    value={formData.telefono}
                                    onChange={handleFormChange}
                                    placeholder="Teléfono (9 dígitos)"
                                    disabled={primerLogin}
                                    maxLength={9}
                                    required
                                />

                                <div className="form-row-compact">
                                    <select
                                        name="departamento_id"
                                        value={ubicacionSeleccionada.departamento_id}
                                        onChange={handleUbicacionChange}
                                        disabled={primerLogin}
                                        required
                                    >
                                        <option value="">Departamento</option>
                                        {departamentos.map(d => (
                                            <option key={d.departamento_id} value={d.departamento_id}>
                                                {d.nombre_departamento}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        name="provincia_id"
                                        value={ubicacionSeleccionada.provincia_id}
                                        onChange={handleUbicacionChange}
                                        disabled={primerLogin || !ubicacionSeleccionada.departamento_id}
                                        required
                                    >
                                        <option value="">Provincia</option>
                                        {provincias.map(p => (
                                            <option key={p.provincia_id} value={p.provincia_id}>
                                                {p.nombre_provincia}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <select
                                    name="distrito_id"
                                    value={formData.distrito_id}
                                    onChange={handleFormChange}
                                    disabled={primerLogin || !ubicacionSeleccionada.provincia_id}
                                    required
                                >
                                    <option value="">Distrito</option>
                                    {distritos.map(d => (
                                        <option key={d.distrito_id} value={d.distrito_id}>
                                            {d.nombre_distrito}
                                        </option>
                                    ))}
                                </select>

                                <label htmlFor="direccion_detalle">Dirección Detallada</label>
                                <input
                                    type="text"
                                    name="direccion_detalle"
                                    id="direccion_detalle"
                                    value={formData.direccion_detalle}
                                    onChange={handleFormChange}
                                    placeholder="Av., Calle, Número, etc."
                                    disabled={primerLogin}
                                />
                                
                                <button 
                                    type="submit" 
                                    className="btn-submit-perfil"
                                    disabled={primerLogin}
                                >
                                    💾 Guardar Cambios
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PerfilAdmin;
