import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GestionDocentes.css'; // Asegúrate que la ruta sea correcta
import {
  FaPlus, FaSearch, FaFilter, FaEye, FaEdit,
  FaChevronLeft, FaChevronRight, FaTimes
} from 'react-icons/fa';

// --- Hook personalizado ---
function useFetch(url) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (url) {
      fetch(url)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Fetch error: ${res.status}`)))
        .then(data => {
          const key = Object.keys(data)[0];
          setData(Array.isArray(data[key]) ? data[key] : []);
        })
        .catch(err => { console.error("Error en useFetch:", url, err); setData([]); });
    } else { setData([]); }
  }, [url]);
  return data;
}

// --- Componente del Modal de Edición ---
function ModalEditarDocente({ docente, onClose, onSave }) {
    // Código del modal de edición completo
    const [formData, setFormData] = useState(null);
    const [error, setError] = useState("");
    const [selectedDepa, setSelectedDepa] = useState("");
    const [selectedProvi, setSelectedProvi] = useState("");
    const escuelas = useFetch("http://127.0.0.1:5000/admin/escuelas");
    const departamentos = useFetch("http://127.0.0.1:5000/admin/departamentos");
    const provincias = useFetch(selectedDepa ? `http://127.0.0.1:5000/admin/provincias/${selectedDepa}` : null);
    const distritos = useFetch(selectedProvi ? `http://127.0.0.1:5000/admin/distritos/${selectedProvi}` : null);

    useEffect(() => {
      if (docente) {
        const fecha = docente.fecha_nacimiento ? docente.fecha_nacimiento.split('T')[0].split(' ')[0] : '';
        setFormData({
          nombres: docente.nombres || '', apellidos: docente.apellidos || '',
          dni: docente.dni || '', telefono: docente.telefono || '',
          correo: docente.correo || '', escuela_id: docente.escuela_id || '',
          fecha_nacimiento: fecha, direccion_desc: docente.direccion_desc || '',
          id_distrito: docente.id_distrito || '', estado: docente.estado === true
        });
        setSelectedDepa(docente.id_departamento || ""); setSelectedProvi(docente.id_provincia || "");
      }
    }, [docente]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: name === 'estado' ? (value === 'true') : value }));
    };
    const handleDepaChange = (e) => { setSelectedDepa(e.target.value); setSelectedProvi(""); setFormData(f => ({ ...f, id_distrito: "" })); };
    const handleProviChange = (e) => { setSelectedProvi(e.target.value); setFormData(f => ({ ...f, id_distrito: "" })); };
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.escuela_id || !formData.id_distrito) { setError("Complete escuela y dirección."); return; }
      setError(""); onSave(docente.usuario_id, formData);
    };

    if (!formData) return null;

    return (
      <div className="modal-overlay"> <div className="modal-content">
          <div className="modal-header"><h3>Modificar Docente</h3><button onClick={onClose} className="modal-close-btn"><FaTimes /></button></div>
          <div className="modal-body"> <form onSubmit={handleSubmit}>
              {error && <div className="alert-error">{error}</div>}
              <div className="form-grid">
                <div className="form-group"><label>Nombres</label><input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required /></div>
                <div className="form-group"><label>Apellidos</label><input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required /></div>
                <div className="form-group"><label>DNI</label><input type="text" name="dni" value={formData.dni} onChange={handleChange} required pattern="\d{8}" title="8 dígitos"/></div>
                <div className="form-group"><label>Teléfono</label><input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required pattern="\d{9}" title="9 dígitos"/></div>
                <div className="form-group full-width"><label>Correo</label><input type="email" name="correo" value={formData.correo} onChange={handleChange} required /></div>
                <div className="form-group"><label>Fecha Nacimiento</label><input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required /></div>
                <div className="form-group"><label>Estado</label><select name="estado" value={formData.estado} onChange={handleChange} required><option value={true}>Activo</option><option value={false}>Inactivo</option></select></div>
                <div className="form-group full-width"><label>Escuela</label><select name="escuela_id" value={formData.escuela_id} onChange={handleChange} required><option value="">Seleccionar</option>{escuelas.map(esc => (<option key={esc.escuela_id} value={esc.escuela_id}>{esc.nombre_escuela} - {esc.facultad}</option>))}</select></div>
                <hr className="full-width" />
                <div className="form-group"><label>Departamento</label><select value={selectedDepa} onChange={handleDepaChange} required><option value="">Seleccionar</option>{departamentos.map(dep => (<option key={dep.departamento_id} value={dep.departamento_id}>{dep.nombre_departamento}</option>))}</select></div>
                <div className="form-group"><label>Provincia</label><select value={selectedProvi} onChange={handleProviChange} disabled={!selectedDepa} required><option value="">Seleccionar</option>{provincias.map(prov => (<option key={prov.provincia_id} value={prov.provincia_id}>{prov.nombre_provincia}</option>))}</select></div>
                <div className="form-group"><label>Distrito</label><select name="id_distrito" value={formData.id_distrito} onChange={handleChange} disabled={!selectedProvi} required><option value="">Seleccionar</option>{distritos.map(dist => (<option key={dist.distrito_id} value={dist.distrito_id}>{dist.nombre_distrito}</option>))}</select></div>
                <div className="form-group full-width"><label>Dirección</label><input type="text" name="direccion_desc" value={formData.direccion_desc} onChange={handleChange} placeholder="Ej: Av. Principal 123" required /></div>
              </div>
              <button type="submit" className="btn-submit-modal">Guardar Cambios</button>
          </form> </div>
      </div> </div>
    );
}

// --- Componente del Modal de Filtros Avanzados ---
function ModalFiltrosAvanzados({ onClose, onApplyFilters, escuelas }) {
    const [filtroEscuela, setFiltroEscuela] = useState('');

    const handleApply = () => {
        onApplyFilters({ escuela_id: filtroEscuela });
        onClose();
    };

    const handleReset = () => {
        setFiltroEscuela('');
        onApplyFilters({}); // Aplica filtros vacíos (resetea)
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content filter-modal">
                <div className="modal-header">
                    <h3>Filtros Avanzados</h3>
                    <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Filtrar por Escuela:</label>
                        <select
                            value={filtroEscuela}
                            onChange={(e) => setFiltroEscuela(e.target.value)}
                        >
                            <option value="">Todas las escuelas</option>
                            {escuelas.map(esc => (
                                <option key={esc.escuela_id} value={esc.escuela_id}>
                                    {esc.nombre_escuela}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Añadir más campos de filtro aquí si es necesario */}
                    <div className="modal-filter-buttons">
                        <button onClick={handleReset} className="btn btn-secondary">Limpiar</button>
                        <button onClick={handleApply} className="btn btn-primary">Aplicar Filtros</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Componente Principal ---
function GestionDocentes() {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDocente, setCurrentDocente] = useState(null);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const escuelasParaFiltro = useFetch("http://127.0.0.1:5000/admin/escuelas");

  useEffect(() => { fetchDocentes(); }, []);

  const fetchDocentes = async () => {
    try {
        setLoading(true); setError(null);
        const response = await fetch('http://127.0.0.1:5000/admin/docentes');
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        // Asegurarse de que el backend envía 'codigo_docente'
        // Si no lo envía, la columna 'Código' mostrará 'N/A'
        setDocentes(data);
      } catch (err) { console.error("Error al cargar docentes:", err); setError("No se pudieron cargar los datos.");
      } finally { setLoading(false); }
  };

  const handleEditClick = (docente) => { setCurrentDocente(docente); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setCurrentDocente(null); };

  const handleSave = async (usuario_id, formData) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/admin/docentes/${usuario_id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al actualizar");
        alert("Docente actualizado con éxito");
        handleCloseEditModal(); fetchDocentes();
      } catch (err) { console.error("Error al guardar:", err); alert(`Error al guardar: ${err.message}`); }
  };

  // Abre el modal de filtros
  const handleFiltrosClick = () => { setIsFiltrosModalOpen(true); };
  // Cierra el modal de filtros
  const handleCloseFiltrosModal = () => { setIsFiltrosModalOpen(false); };
  // Aplica los filtros avanzados seleccionados
  const handleApplyAdvancedFilters = (filters) => { setAdvancedFilters(filters); };

  // Filtra la lista
  const filteredDocentes = docentes.filter(docente => {
    const nombreCompleto = `${docente.nombres || ''} ${docente.apellidos || ''}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch =
        nombreCompleto.includes(search) ||
        (docente.dni || '').includes(search) ||
        (docente.codigo_docente || '').toLowerCase().includes(search); // Busca por código

    const estadoDocenteBooleano = docente.estado === true;
    let matchesStatus = true;
    if (statusFilter === 'Activo') { matchesStatus = estadoDocenteBooleano; }
    else if (statusFilter === 'Inactivo') { matchesStatus = !estadoDocenteBooleano; }

    let matchesAdvanced = true;
    if (advancedFilters.escuela_id && docente.escuela_id != advancedFilters.escuela_id) {
        matchesAdvanced = false;
    }

    return matchesSearch && matchesStatus && matchesAdvanced;
  });

  // Renderiza las filas
  const renderTablaBody = () => {
    // <<< Colspan está ajustado a 7 >>>
    if (loading) return <tr><td colSpan="7" style={{textAlign: 'center'}}>Cargando...</td></tr>;
    if (error) return <tr><td colSpan="7" style={{ color: 'red', textAlign: 'center' }}>{error}</td></tr>;
    if (filteredDocentes.length === 0) return <tr><td colSpan="7" style={{textAlign: 'center'}}>No se encontraron.</td></tr>;

    return filteredDocentes.map((docente) => {
      // Formateo visual del código y estado
      const numeroFormateado = String(docente.docente_id).padStart(3, '0'); // Asume que tienes docente_id
      const currentYear = new Date().getFullYear();
      const codigoVisual = `DOC-${currentYear}-${numeroFormateado}`; // Genera código visual
      
      const estadoBooleano = docente.estado === true;
      const estadoTexto = estadoBooleano ? 'Activo' : 'Inactivo';
      const estadoClase = estadoBooleano ? 'activo' : 'inactivo';

      return (
        <tr key={docente.usuario_id || docente.docente_id}>
          {/* <<< Muestra código de BD si existe, sino el visual >>> */}
          <td>{docente.codigo_docente || codigoVisual || 'N/A'}</td>
          <td>{docente.nombre_escuela || 'N/A'}</td>
          <td>{docente.nombres} {docente.apellidos}</td>
          <td>{docente.dni || 'N/A'}</td>
          <td>{docente.correo}</td>
          <td><span className={`status-pill ${estadoClase}`}>{estadoTexto}</span></td>
          <td className="action-icons">
            <FaEye className="icon-view" title="Ver detalles" />
            <FaEdit className="icon-edit" title="Editar" onClick={() => handleEditClick(docente)} />
          </td>
        </tr>
      );
    });
  };

  // JSX principal
  return (
    <div className="gestion-container">
      {/* Cabecera */}
      <div className="gestion-header">
        <div className="header-title">
            <h1>Gestión de Docentes - EPIS</h1> <p>Escuela Profesional de Ingeniería de Sistemas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/crear-docente')}><FaPlus /> Registrar</button>
      </div>
      {/* Filtros */}
      <div className="gestion-filters">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          {/* <<< Placeholder actualizado >>> */}
          <input type="text" placeholder="Buscar por Nombre, DNI o Código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="Todos los estados">Todos</option><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option>
        </select>
        {/* --- Botón con handler --- */}
        <button className="btn btn-secondary" onClick={handleFiltrosClick}>
          <FaFilter /> Filtros
        </button>
      </div>
      {/* Tabla */}
      <div className="table-wrapper">
        <table className="gestion-table">
          <thead>
            <tr>
              {/* <<< Header: Código >>> */}
              <th>Código</th><th>Escuela</th><th>Nombres y Apellidos</th><th>DNI</th><th>Email</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>{renderTablaBody()}</tbody>
        </table>
      </div>
      {/* Paginación */}
      <div className="gestion-pagination">
        <span>Mostrando {filteredDocentes.length} de {docentes.length} docentes</span>
        <div className="pagination-buttons">
          <button className="btn-pagination" disabled><FaChevronLeft /> Ant</button>
          <button className="btn-pagination active">1</button>
          <button className="btn-pagination">Sig <FaChevronRight /></button>
        </div>
      </div>
      {/* Modal de Edición */}
      {isEditModalOpen && (<ModalEditarDocente docente={currentDocente} onClose={handleCloseEditModal} onSave={handleSave} />)}
      {/* Modal de Filtros */}
      {isFiltrosModalOpen && (<ModalFiltrosAvanzados onClose={handleCloseFiltrosModal} onApplyFilters={handleApplyAdvancedFilters} escuelas={escuelasParaFiltro}/>)}
    </div>
  );
}

export default GestionDocentes;