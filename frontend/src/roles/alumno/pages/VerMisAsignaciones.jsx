import React, { useEffect, useState } from "react";
import "../styles/mis-asignaciones.css";

function VerMisAsignaciones({ usuario }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!usuario?.estudiante_id) {
      setError("No se encontró el ID del estudiante");
      setCargando(false);
      return;
    }

    cargarAsignaciones();
  }, [usuario]);

  const cargarAsignaciones = async () => {
    setCargando(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/alumno/mis-asignaciones/${usuario.estudiante_id}`
      );
      
      if (!response.ok) throw new Error('Error al cargar asignaciones');
      
      const data = await response.json();
      setAsignaciones(data.asignaciones);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="mis-asignaciones-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mis-asignaciones-container">
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-asignaciones-container">
      <div className="header">
        <h1>📚 Mis Cursos</h1>
        <p>Cursos en los que estás matriculado este ciclo</p>
      </div>

      {asignaciones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No tienes cursos matriculados</h3>
          <p>Solicita tu matrícula para ver tus cursos aquí</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="resumen-grid">
            <div className="resumen-card">
              <div className="resumen-icon">📚</div>
              <div className="resumen-info">
                <span className="resumen-numero">{asignaciones.length}</span>
                <span className="resumen-label">Cursos Matriculados</span>
              </div>
            </div>
            <div className="resumen-card">
              <div className="resumen-icon">⭐</div>
              <div className="resumen-info">
                <span className="resumen-numero">
                  {asignaciones.reduce((sum, a) => sum + (a.creditos || 0), 0)}
                </span>
                <span className="resumen-label">Créditos Totales</span>
              </div>
            </div>
            <div className="resumen-card">
              <div className="resumen-icon">✓</div>
              <div className="resumen-info">
                <span className="resumen-numero">
                  {(asignaciones.reduce((sum, a) => sum + a.porcentaje_asistencia, 0) / asignaciones.length).toFixed(1)}%
                </span>
                <span className="resumen-label">Asistencia Promedio</span>
              </div>
            </div>
          </div>

          {/* Lista de cursos */}
          <div className="cursos-grid">
            {asignaciones.map((asignacion) => (
              <div key={asignacion.matricula_id} className="curso-card">
                <div className="curso-header">
                  <div>
                    <h3>{asignacion.curso_nombre}</h3>
                    <span className="curso-codigo">{asignacion.curso_codigo}</span>
                  </div>
                  <span className="curso-creditos">{asignacion.creditos} créditos</span>
                </div>

                <div className="curso-body">
                  <div className="curso-info-item">
                    <span className="label">👨‍🏫 Docente:</span>
                    <span className="value">{asignacion.docente}</span>
                  </div>

                  <div className="curso-info-item">
                    <span className="label">📖 Sección:</span>
                    <span className="value">{asignacion.seccion_codigo}</span>
                  </div>

                  {asignacion.horario.dia && (
                    <div className="curso-info-item">
                      <span className="label">🕐 Horario:</span>
                      <span className="value">
                        {asignacion.horario.dia} {asignacion.horario.hora_inicio?.substring(0, 5)} - {asignacion.horario.hora_fin?.substring(0, 5)}
                      </span>
                    </div>
                  )}

                  <div className="curso-info-item">
                    <span className="label">📅 Matriculado:</span>
                    <span className="value">
                      {new Date(asignacion.fecha_matricula).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                <div className="curso-footer">
                  <div className="asistencia-bar">
                    <div className="asistencia-label">
                      <span>Asistencia</span>
                      <span className={`porcentaje ${asignacion.porcentaje_asistencia < 70 ? 'bajo' : ''}`}>
                        {asignacion.porcentaje_asistencia}%
                      </span>
                    </div>
                    <div className="asistencia-progress">
                      <div 
                        className="asistencia-fill"
                        style={{ width: `${asignacion.porcentaje_asistencia}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default VerMisAsignaciones;