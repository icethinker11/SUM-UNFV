import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, Trash2, ListChecks } from 'lucide-react';

// -----------------------------------------------------------------------------------
// ¡ATENCIÓN! El error está en una de estas dos líneas.
// Por favor, verifica tu explorador de archivos y asegúrate de que:
// 1. El archivo 'ModalAula.jsx' está en esta misma carpeta.
// 2. La carpeta 'styles' está aquí y DENTRO de ella está el archivo 'GestionAulas.css'.
// Revisa mayúsculas y minúsculas.
// -----------------------------------------------------------------------------------
import ModalAula from './ModalAula.jsx'; 
import '../styles/gestion-aula.css';

const BASE_URL = 'http://localhost:5000/superadmin/aulas';

const AULA_INICIAL = {
    nombre_aula: '',
    capacidad: '',
    estado: 'OPERATIVO',
    tipo_aula_id: '',
    pabellon_id: '',
};

function GestionAulas() {
    const [aulas, setAulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const cargarAulas = async () => {
        setLoading(true);
        try {
            const res = await axios.get(BASE_URL);
            setAulas(res.data);
        } catch (err) {
            toast.error("Error al cargar los datos de las aulas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarAulas();
    }, []);

    const eliminarAula = async (aulaId) => {
        if (!window.confirm("¿Está seguro de eliminar esta aula?")) return;
        try {
            await axios.delete(`${BASE_URL}/${aulaId}`);
            toast.success("🗑️ Aula eliminada exitosamente.");
            cargarAulas();
        } catch (err) {
            const serverError = err.response?.data?.error || "Error al eliminar el aula.";
            toast.error(serverError);
        }
    };

    const handleOpenModal = (aula = null) => {
        setAulaSeleccionada(aula);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAulaSeleccionada(null);
    };

    const handleSaveAula = async (formData) => {
        try {
            if (formData.aula_id) {
                await axios.put(`${BASE_URL}/${formData.aula_id}`, formData);
                toast.success("✅ Aula modificada exitosamente.");
            } else {
                await axios.post(BASE_URL, formData);
                toast.success("✅ Aula creada exitosamente.");
            }
            handleCloseModal();
            cargarAulas();
        } catch (err) {
            const serverError = err.response?.data?.error || "Error al guardar el aula.";
            toast.error(serverError);
        }
    };

    const getEstadoClass = (estado) => {
        if (estado === 'OPERATIVO') return 'status-tag status-disponible'; 
        if (estado === 'MANTENIMIENTO') return 'status-tag status-mantenimiento';
        return 'status-tag';
    };

    const aulasFiltradas = aulas.filter(aula =>
        (aula.codigo?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
        (aula.nombre?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
        (aula.ubicacion?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-state">Cargando gestión de aulas...</div>;

    return (
        <div className="gestion-aulas-container">
            <div className="header-container">
                <h1 className="main-title"><ListChecks size={30} style={{ marginRight: '10px' }} /> Gestión de Aulas</h1>
                <p className="subtitle">Administra las aulas del centro educativo</p>
            </div>
            
            <div className="search-bar-actions">
                <div className="search-input-group">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por código, nombre o ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Nueva Aula
                </button>
            </div>
            <div className="aulas-table-container">
                {aulasFiltradas.length > 0 ? (
                    <table className="aulas-table">
                        <thead>
                            <tr>
                                <th>CÓDIGO</th>
                                <th>NOMBRE</th>
                                <th>CAPACIDAD</th>
                                <th>TIPO</th>
                                <th>UBICACIÓN</th>
                                <th>ESTADO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aulasFiltradas.map((aula) => (
                                <tr key={aula.aula_id}>
                                    <td>{aula.codigo}</td>
                                    <td>{aula.nombre}</td>
                                    <td>{aula.capacidad}</td>
                                    <td>{aula.tipo}</td>
                                    <td>{aula.ubicacion}</td>
                                    <td><span className={getEstadoClass(aula.estado)}>{aula.estado}</span></td>
                                    <td className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(aula)}><Edit size={16} /></button>
                                        <button className="btn-icon btn-delete" onClick={() => eliminarAula(aula.aula_id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="info-message">{searchTerm ? "No se encontraron aulas." : "No hay aulas registradas."}</div>
                )}
            </div>
            <ModalAula
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveAula}
                aulaData={aulaSeleccionada}
                initialState={AULA_INICIAL} 
            />
        </div>
    );
}

export default GestionAulas;
