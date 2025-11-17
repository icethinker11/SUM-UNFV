import React, { useEffect, useState } from "react";
import "../styles/calendario-docente.css";

function CalendarioDocente() {
  const docenteId = sessionStorage.getItem("docente_id");

  const [horario, setHorario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [vistaActual, setVistaActual] = useState('semana');

  useEffect(() => {
    if (!docenteId) {
      setError("Error: ID de docente no encontrado. Por favor, inicie sesión.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    fetch(`http://localhost:5000/api/calendario/horario/${docenteId}`)
      .then(res => {
        console.log("Status:", res.status);
        if (!res.ok) {
          if (res.status === 404) {
            return res.json().then(data => {
              throw new Error(data.message || 'No se encontró horario');
            });
          }
          throw new Error('Error al obtener el horario');
        }
        return res.json();
      })
      .then(data => {
        console.log("Datos recibidos:", data);
        setHorario(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error en calendario:", err);
        setError(err.message || "No se pudo cargar el horario. Intente más tarde.");
        setCargando(false);
      });
  }, [docenteId]);

  const horaAMinutos = (hora) => {
    if (!hora) return 0;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const obtenerRangoHoras = () => {
    if (horario.length === 0) return { inicio: 7, fin: 20 };
    
    let horaMin = 24 * 60;
    let horaMax = 0;

    horario.forEach(clase => {
      const inicio = horaAMinutos(clase.hora_inicio);
      const fin = horaAMinutos(clase.hora_fin);
      horaMin = Math.min(horaMin, inicio);
      horaMax = Math.max(horaMax, fin);
    });

    return {
      inicio: Math.floor(horaMin / 60),
      fin: Math.ceil(horaMax / 60)
    };
  };

  const rangoHoras = obtenerRangoHoras();
  const horas = Array.from(
    { length: rangoHoras.fin - rangoHoras.inicio + 1 },
    (_, i) => rangoHoras.inicio + i
  );

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const horarioPorDia = {};
  diasSemana.forEach(dia => {
    horarioPorDia[dia] = horario.filter(
      item => item.dia === dia || (dia === 'Miércoles' && item.dia === 'Miercoles')
    );
  });

  const calcularPosicion = (clase) => {
    const inicioMinutos = horaAMinutos(clase.hora_inicio);
    const finMinutos = horaAMinutos(clase.hora_fin);
    const duracionMinutos = finMinutos - inicioMinutos;
    
    const inicioDelDia = rangoHoras.inicio * 60;
    const offsetMinutos = inicioMinutos - inicioDelDia;
    
    const pixelesPorMinuto = 80 / 60;
    
    return {
      top: offsetMinutos * pixelesPorMinuto,
      height: duracionMinutos * pixelesPorMinuto
    };
  };

  const colores = [
    'color-blue', 'color-green', 'color-purple', 'color-pink',
    'color-yellow', 'color-indigo', 'color-red', 'color-teal'
  ];

  const obtenerColor = (index) => colores[index % colores.length];

  if (cargando) {
    return (
      <div className="calendario-container">
        <div className="calendario-content">
          <div className="loading-card">
            <div className="loading-pulse">
              <div className="loading-bar"></div>
              <div className="loading-text">Cargando horario...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendario-container">
        <div className="calendario-content">
          <div className="error-card">
            <p className="error-message">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-retry">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendario-container">
      <div className="calendario-content">
        {/* Header */}
        <div className="calendario-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Mi Calendario</h1>
              <p>Horario académico semanal</p>
            </div>
            <div className="header-buttons">
              <button
                onClick={() => setVistaActual('semana')}
                className={`btn-vista ${vistaActual === 'semana' ? 'active' : ''}`}
              >
                Vista Semana
              </button>
              <button
                onClick={() => setVistaActual('lista')}
                className={`btn-vista ${vistaActual === 'lista' ? 'active' : ''}`}
              >
                Vista Lista
              </button>
            </div>
          </div>
        </div>

        {horario.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No tienes clases asignadas</p>
          </div>
        ) : vistaActual === 'semana' ? (
          /* Vista Calendario */
          <div className="calendario-grid-wrapper">
            <div className="calendario-scroll">
              <div className="calendario-grid">
                {/* Header días */}
                <div className="grid-header">
                  <div className="hora-column-header">Hora</div>
                  {diasSemana.slice(0, 7).map(dia => (
                    <div key={dia} className="dia-header">
                      <div className="dia-nombre">{dia}</div>
                      <div className="dia-count">
                        {horarioPorDia[dia]?.length || 0} clases
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid horas */}
                <div className="grid-body">
                  <div className="hora-column">
                    {horas.map(hora => (
                      <div key={hora} className="hora-cell">
                        {hora.toString().padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>

                  {/* Columnas días */}
                  {diasSemana.slice(0, 7).map((dia, diaIndex) => (
                    <div key={dia} className="dia-column">
                      {horas.map(hora => (
                        <div key={hora} className="hora-slot"></div>
                      ))}

                      {/* Clases */}
                      {horarioPorDia[dia]?.map((clase, index) => {
                        const posicion = calcularPosicion(clase);
                        const color = obtenerColor(diaIndex * 10 + index);
                        
                        return (
                          <div
                            key={index}
                            className={`clase-block ${color}`}
                            style={{
                              top: `${posicion.top}px`,
                              height: `${posicion.height}px`
                            }}
                          >
                            <div className="clase-content">
                              <div className="clase-info">
                                <div className="clase-titulo">{clase.curso}</div>
                                <div className="clase-hora">
                                  {clase.hora_inicio?.substring(0, 5)} - {clase.hora_fin?.substring(0, 5)}
                                </div>
                              </div>
                              <div className="clase-detalles">
                                <div>📚 Sección {clase.seccion}</div>
                                <div>🏫 Aula {clase.aula_id}</div>
                                <div>👥 {clase.cantidad_estudiantes} est.</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Vista Lista */
          <div className="lista-container">
            {diasSemana.map(dia => {
              const clasesDelDia = horarioPorDia[dia];
              if (!clasesDelDia || clasesDelDia.length === 0) return null;

              return (
                <div key={dia} className="lista-dia">
                  <div className="lista-dia-header">
                    <h3>{dia}</h3>
                    <span className="lista-badge">
                      {clasesDelDia.length} {clasesDelDia.length === 1 ? 'clase' : 'clases'}
                    </span>
                  </div>
                  <div className="lista-clases">
                    {clasesDelDia
                      .sort((a, b) => horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio))
                      .map((clase, index) => (
                        <div key={index} className="lista-clase-item">
                          <div className="lista-hora">
                            <div className="hora-inicio">{clase.hora_inicio?.substring(0, 5)}</div>
                            <div className="hora-fin">{clase.hora_fin?.substring(0, 5)}</div>
                          </div>
                          <div className="lista-clase-info">
                            <h4>{clase.curso}</h4>
                            <div className="lista-clase-meta">
                              <span>📚 Sección {clase.seccion}</span>
                              <span>🏫 Aula {clase.aula_id}</span>
                              <span>👥 {clase.cantidad_estudiantes} estudiantes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estadísticas */}
        {horario.length > 0 && (
          <div className="estadisticas-grid">
            <div className="estadistica-card">
              <div className="estadistica-valor">{horario.length}</div>
              <div className="estadistica-label">Total de Clases</div>
            </div>
            <div className="estadistica-card">
              <div className="estadistica-valor">
                {Object.values(horarioPorDia).filter(d => d.length > 0).length}
              </div>
              <div className="estadistica-label">Días Activos</div>
            </div>
            <div className="estadistica-card">
              <div className="estadistica-valor">
                {horario.reduce((sum, c) => sum + (c.cantidad_estudiantes || 0), 0)}
              </div>
              <div className="estadistica-label">Total Estudiantes</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarioDocente;