import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { Search, Plus, Trash2, X, BookOpen, Check, Edit } from 'lucide-react';

// -----------------------------------------------------------------------------------
// ¡ATENCIÓN! CORRECCIÓN DE RUTA
//
// El error indica que el archivo CSS no se encuentra. La ruta correcta, 
// según tu estructura de carpetas, es DENTRO de la subcarpeta 'styles'.
//
// Estructura CORRECTA que debes tener:
// └── pages/
//     ├── GestionarPrerrequisitos.jsx (ESTE ARCHIVO)
//     └── styles/
//         └── prerrequisitos.css      (EL ARCHIVO CSS DEBE ESTAR AQUÍ DENTRO)
//
// -----------------------------------------------------------------------------------
import '../styles/prerrequisitos.css';

const API_URL = 'http://localhost:5000/superadmin';

function GestionarPrerrequisitos() {
    const location = useLocation();
    const navigate = useNavigate();

    const [view, setView] = useState('lista'); 
    const [allCourses, setAllCourses] = useState([]);
    const [coursesWithPrereqs, setCoursesWithPrereqs] = useState([]);
    
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedPrereqs, setSelectedPrereqs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCourse, setEditingCourse] = useState(null);

    useEffect(() => {
        if (location.pathname.includes('definir-prerrequisito')) {
            setView('configurar');
        } else {
            setView('lista');
        }
    }, [location.pathname]);

    const fetchAllCourses = async () => {
        try {
            const res = await axios.get(`${API_URL}/cursos`);
            setAllCourses(res.data.cursos || []);
        } catch (error) {
            toast.error("Error al cargar la lista de cursos.");
        }
    };

    const fetchCoursesWithPrereqs = async () => {
        try {
            const res = await axios.get(`${API_URL}/cursos-con-prerrequisitos`);
            setCoursesWithPrereqs(res.data.cursos || []);
        } catch (error) {
            toast.error("Error al cargar los cursos configurados.");
        }
    };

    useEffect(() => {
        fetchAllCourses();
        if (view === 'lista') {
            fetchCoursesWithPrereqs();
        }
    }, [view]);
    
    const handleEdit = (courseToEdit) => {
        const existingPrereqs = courseToEdit.prerrequisitos.map(prereq => {
            return allCourses.find(c => c.id_curso === prereq.id_curso_requerido);
        }).filter(Boolean);

        setEditingCourse(courseToEdit);
        setSelectedCourse(courseToEdit);
        setSelectedPrereqs(existingPrereqs);
        navigate('/superadmin/definir-prerrequisito');
    };

    const handleDeleteCoursePrereqs = async (courseId, courseName) => {
        if (!window.confirm(`¿Está seguro de eliminar TODOS los prerrequisitos del curso "${courseName}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/prerrequisitos/curso/${courseId}`);
            toast.success(`Prerrequisitos de "${courseName}" eliminados correctamente.`);
            fetchCoursesWithPrereqs();
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Error al eliminar los prerrequisitos.";
            toast.error(errorMessage);
        }
    };

    const handleSelectCourse = (course) => {
        setSelectedCourse(course);
        setSelectedPrereqs([]);
    };

    const handleAddPrereq = (prereq) => {
        if (selectedCourse && selectedCourse.id_curso === prereq.id_curso) {
            toast.warn("Un curso no puede ser prerrequisito de sí mismo.");
            return;
        }
        if (!selectedPrereqs.some(p => p.id_curso === prereq.id_curso)) {
            setSelectedPrereqs([...selectedPrereqs, prereq]);
        }
    };

    const handleRemovePrereq = (prereqId) => {
        setSelectedPrereqs(selectedPrereqs.filter(p => p.id_curso !== prereqId));
    };

    const handleSavePrerequisites = async () => {
        if (!selectedCourse) {
             toast.error("Debe seleccionar un curso.");
             return;
        }
        
        const courseId = selectedCourse.id_curso || selectedCourse.curso_id;

        if (!courseId) {
            toast.error("No se pudo identificar el curso seleccionado. Inténtelo de nuevo.");
            return;
        }

        try {
            await axios.delete(`${API_URL}/prerrequisitos/curso/${courseId}`);
            
            if (selectedPrereqs.length > 0) {
                const savePromises = selectedPrereqs.map(prereq => 
                    axios.post(`${API_URL}/definir-prerrequisito`, {
                        id_curso: courseId,
                        id_curso_requerido: prereq.id_curso
                    })
                );
                await Promise.all(savePromises);
            }
            
            toast.success(`Prerrequisitos ${editingCourse ? 'actualizados' : 'guardados'} exitosamente.`);
            
            handleCancelEdit();

        } catch (error) {
            const errorMessage = error.response?.data?.error || "Error al guardar los prerrequisitos.";
            toast.error(errorMessage);
        }
    };
    
    const handleCancelEdit = () => {
        setSelectedCourse(null);
        setSelectedPrereqs([]);
        setEditingCourse(null);
        navigate('/superadmin/listar-prerrequisitos');
    }

    const filteredCourses = allCourses.filter(course =>
        (course.nombre_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
         course.codigo_curso.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const renderConfigView = () => (
        <div className="config-container">
            <div className="card">
                <h2 className="section-title">1. Seleccionar Curso</h2>
                {editingCourse ? (
                     <div className="selected-item-box">
                        <div className="item-info">
                            <span className="course-code">{editingCourse.codigo_curso}</span>
                            <span className="course-name">{editingCourse.nombre_curso}</span>
                        </div>
                        <Edit size={18} className="icon-disabled" />
                    </div>
                ) : !selectedCourse ? (
                    <>
                        <div className="search-input-group">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por código o nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="course-list-selector">
                            {filteredCourses.map(course => (
                                <div key={course.id_curso} className="course-item" onClick={() => handleSelectCourse(course)}>
                                    <span className="course-code">{course.codigo_curso}</span>
                                    <span className="course-name">{course.nombre_curso}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="selected-item-box">
                        <div className="item-info">
                            <span className="course-code">{selectedCourse.codigo_curso}</span>
                            <span className="course-name">{selectedCourse.nombre_curso}</span>
                        </div>
                        <button onClick={() => setSelectedCourse(null)} className="btn-icon"><X size={18} /></button>
                    </div>
                )}
            </div>

            <div className="card">
                 <h2 className="section-title">2. Seleccionar Prerrequisitos</h2>
                {!selectedCourse ? (
                    <div className="placeholder-message">
                        <BookOpen size={40} />
                        <p>Primero selecciona un curso</p>
                    </div>
                ) : (
                    <>
                        <p className="available-courses-label">Cursos disponibles:</p>
                        <div className="course-list-selector">
                            {allCourses.map(course => {
                                const isSelected = selectedPrereqs.some(p => p.id_curso === course.id_curso);
                                const isSelf = selectedCourse.id_curso === course.id_curso;
                                return (
                                    <div 
                                        key={course.id_curso} 
                                        className={`course-item-prereq ${isSelected ? 'selected' : ''} ${isSelf ? 'disabled' : ''}`}
                                        onClick={() => !isSelf && (isSelected ? handleRemovePrereq(course.id_curso) : handleAddPrereq(course))}
                                    >
                                        <div className="item-info">
                                            <span className="course-code">{course.codigo_curso}</span>
                                            <span className="course-name">{course.nombre_curso}</span>
                                        </div>
                                        {isSelected ? <Check size={20} /> : <Plus size={20} />}
                                    </div>
                                );
                            })}
                        </div>
                        {selectedPrereqs.length > 0 && (
                            <div className="selected-prereqs-section">
                                <p className="selected-prereqs-label">Prerrequisitos seleccionados ({selectedPrereqs.length}):</p>
                                {selectedPrereqs.map(prereq => (
                                    <div key={prereq.id_curso} className="selected-item-box green">
                                        <div className="item-info">
                                            <span className="course-code">{prereq.codigo_curso}</span>
                                            <span className="course-name">{prereq.nombre_curso}</span>
                                        </div>
                                        <button onClick={() => handleRemovePrereq(prereq.id_curso)} className="btn-icon danger"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                         <div className="config-actions">
                            <button className="btn btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSavePrerequisites}>
                                {editingCourse ? "Actualizar Prerrequisitos" : "Guardar Prerrequisitos"}
                            </button>
                         </div>
                    </>
                )}
            </div>
        </div>
    );
    
    const renderListView = () => (
        <div className="list-container">
            <h2 className="section-title">Cursos con Prerrequisitos Configurados</h2>
             {coursesWithPrereqs.length > 0 ? coursesWithPrereqs.map(course => (
                <div key={course.curso_id} className="card course-prereq-card">
                    <div className="course-header">
                        <h3>{course.codigo_curso} - {course.nombre_curso}</h3>
                        <div className="course-actions">
                            <button className="btn-link" onClick={() => handleEdit(course)}>Editar</button>
                            <button className="btn-link danger" onClick={() => handleDeleteCoursePrereqs(course.curso_id, course.nombre_curso)}>Eliminar</button>
                        </div>
                    </div>
                    <div className="prereq-tags">
                        <p>Prerrequisitos:</p>
                        {course.prerrequisitos.map(prereq => (
                             <span key={prereq.prerrequisito_id} className="prereq-tag">{prereq.codigo_requerido}</span>
                        ))}
                    </div>
                </div>
             )) : (
                <div className="placeholder-message">
                    <p>No hay cursos con prerrequisitos configurados.</p>
                </div>
             )}
        </div>
    );

    return (
        <div className="gestion-prerequisitos-container">
            <div className="header-container">
                <div className="title-section">
                    <BookOpen size={32} />
                    <div>
                        <h1 className="main-title">Gestión de Prerrequisitos</h1>
                        <p className="subtitle">Configurar cursos previos requeridos</p>
                    </div>
                </div>
                <div className="actions-section">
                    <button onClick={handleCancelEdit} className={`btn ${view === 'lista' ? 'btn-secondary-inactive' : 'btn-secondary'}`}>
                        Ver Lista
                    </button>
                    <button
                        onClick={() => {
                            setEditingCourse(null);
                            setSelectedCourse(null);
                            setSelectedPrereqs([]);
                            navigate('/superadmin/definir-prerrequisito');
                        }}
                        className={`btn ${view === 'configurar' ? 'btn-primary-inactive' : 'btn-primary'}`}
                    >
                        Configurar Nuevo
                    </button>
                </div>
            </div>
            {view === 'lista' ? renderListView() : renderConfigView()}
        </div>
    );
}

export default GestionarPrerrequisitos;
