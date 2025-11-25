import React, { useEffect, useState } from "react";
import * as XLSX from 'xlsx-js-style';
import "../styles/tomar-asistencia.css";

function TomarAsistencia() {
  const docenteId = sessionStorage.getItem("docente_id");

  // Estados principales
  const [vista, setVista] = useState('seleccionar'); // seleccionar, tomar, informe
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  
  // Datos de la sesión
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Estados de informe
  const [informe, setInforme] = useState(null);
  
  // Estados de UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!docenteId) {
      setError("No se encontró el ID del docente. Por favor, inicie sesión.");
      return;
    }
    cargarCursos();
  }, [docenteId]);

  const cargarCursos = async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/asistencia/mis-cursos/${docenteId}`);
      if (!response.ok) throw new Error('Error al cargar cursos');
      const data = await response.json();
      setCursos(data.cursos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarCurso = async (curso) => {
    setCursoSeleccionado(curso);
    setCargando(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/asistencia/estudiantes/${curso.asignacion_id}`
      );
      
      if (!response.ok) throw new Error('Error al cargar estudiantes');
      
      const data = await response.json();
      setEstudiantes(data.estudiantes);
      
      // Establecer las horas del bloque si existen
      if (data.hora_inicio) {
        setHoraInicio(data.hora_inicio.substring(0, 5)); // HH:MM
      }
      if (data.hora_fin) {
        setHoraFin(data.hora_fin.substring(0, 5)); // HH:MM
      }
      
      // Inicializar asistencias como null
      const asistenciasIniciales = {};
      data.estudiantes.forEach(est => {
        asistenciasIniciales[est.matricula_id] = null;
      });
      setAsistencias(asistenciasIniciales);
      
      setVista('tomar');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const marcarAsistencia = (matriculaId, estado) => {
    setAsistencias(prev => ({
      ...prev,
      [matriculaId]: estado
    }));
  };

  const marcarTodos = (estado) => {
    const nuevasAsistencias = {};
    estudiantes.forEach(est => {
      nuevasAsistencias[est.matricula_id] = estado;
    });
    setAsistencias(nuevasAsistencias);
  };

  const guardarAsistencia = async () => {
    if (!horaInicio || !horaFin) {
      setError("Por favor, ingrese las horas de inicio y fin de la clase");
      return;
    }

    // Validar que todos tengan asistencia marcada
    const sinMarcar = estudiantes.filter(est => !asistencias[est.matricula_id]);
    if (sinMarcar.length > 0) {
      setError(`Faltan marcar ${sinMarcar.length} estudiantes`);
      return;
    }

    setCargando(true);
    setError(null);

    const asistenciasArray = Object.entries(asistencias).map(([matricula_id, estado]) => ({
      matricula_id: parseInt(matricula_id),
      estado
    }));

    const payload = {
      asignacion_id: cursoSeleccionado.asignacion_id,
      docente_id: parseInt(docenteId),
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      observaciones,
      asistencias: asistenciasArray
    };

    try {
      const response = await fetch('http://localhost:5000/api/asistencia/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al guardar asistencia');
      
      setExito(true);
      setTimeout(() => {
        reiniciar();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const verInforme = async (curso) => {
    setCursoSeleccionado(curso);
    setCargando(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/asistencia/informe/${curso.asignacion_id}`
      );
      
      if (!response.ok) throw new Error('Error al cargar informe');
      
      const data = await response.json();
      setInforme(data);
      setVista('informe');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setVista('seleccionar');
    setCursoSeleccionado(null);
    setEstudiantes([]);
    setAsistencias({});
    setObservaciones('');
    setInforme(null);
    setError(null);
    setExito(false);
    setFecha(new Date().toISOString().split('T')[0]);
    setHoraInicio('');
    setHoraFin('');
  };

  // Función para exportar a Excel con diseño mejorado y colores
  const exportarExcel = () => {
    if (!informe) return;

    const datosExcel = [];
    
    // Título principal
    datosExcel.push(['INFORME DE ASISTENCIA']);
    datosExcel.push([`${informe.curso.nombre} - Sección ${informe.curso.seccion}`]);
    datosExcel.push([`Fecha: ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`]);
    datosExcel.push([]);

    // Encabezados
    const encabezados = [
      'N°',
      'Código',
      'Nombre Completo',
      ...informe.sesiones.map(s => new Date(s.fecha).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit'
      })),
      'Total',
      'Presentes',
      'Ausentes',
      'Tardanzas',
      '% Asistencia'
    ];
    datosExcel.push(encabezados);

    // Datos de estudiantes
    informe.estudiantes.forEach((estudiante, index) => {
      const fila = [
        index + 1,
        estudiante.codigo_universitario,
        `${estudiante.nombres} ${estudiante.apellidos}`,
        ...informe.sesiones.map(sesion => {
          const estado = estudiante.asistencias[sesion.sesion_id];
          if (estado === 'Presente') return '✓';
          if (estado === 'Ausente') return '✗';
          if (estado === 'Tardanza') return '⏱';
          return '-';
        }),
        estudiante.total_sesiones,
        estudiante.presentes,
        estudiante.ausentes,
        estudiante.tardanzas,
        estudiante.porcentaje / 100
      ];
      datosExcel.push(fila);
    });

    // Resumen
    datosExcel.push([]);
    datosExcel.push(['RESUMEN GENERAL']);
    datosExcel.push(['Total Estudiantes:', informe.estudiantes.length]);
    datosExcel.push(['Total Sesiones:', informe.sesiones.length]);
    datosExcel.push(['Promedio Asistencia:', 
      (informe.estudiantes.reduce((sum, e) => sum + e.porcentaje, 0) / informe.estudiantes.length / 100)
    ]);

    // Crear worksheet
    const ws = XLSX.utils.aoa_to_sheet(datosExcel);

    // Estilos
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Estilo título (fila 1)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({r: 0, c: C})];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2C3E50" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Estilo subtítulo (fila 2)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({r: 1, c: C})];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "34495E" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Estilo fecha (fila 3)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({r: 2, c: C})];
      if (cell) {
        cell.s = {
          font: { italic: true, sz: 10 },
          fill: { fgColor: { rgb: "ECF0F1" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Estilo encabezados (fila 5)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({r: 4, c: C})];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "3498DB" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }

    // Estilo datos de estudiantes (alternar colores)
    for (let R = 5; R < 5 + informe.estudiantes.length; ++R) {
      const estudiante = informe.estudiantes[R - 5];
      const isEven = (R - 5) % 2 === 0;
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
        if (cell) {
          // Color de fondo alternado
          const bgColor = isEven ? "FFFFFF" : "F8F9FA";
          
          cell.s = {
            fill: { fgColor: { rgb: bgColor } },
            alignment: { horizontal: C < 3 ? "left" : "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "DEE2E6" } },
              bottom: { style: "thin", color: { rgb: "DEE2E6" } },
              left: { style: "thin", color: { rgb: "DEE2E6" } },
              right: { style: "thin", color: { rgb: "DEE2E6" } }
            }
          };

          // Colores para las columnas de asistencia (✓, ✗, ⏱)
          if (C >= 3 && C < 3 + informe.sesiones.length) {
            const value = cell.v;
            if (value === '✓') {
              cell.s.font = { color: { rgb: "27AE60" }, bold: true, sz: 14 };
            } else if (value === '✗') {
              cell.s.font = { color: { rgb: "E74C3C" }, bold: true, sz: 14 };
            } else if (value === '⏱') {
              cell.s.font = { color: { rgb: "F39C12" }, bold: true, sz: 12 };
            }
          }

          // Columnas de totales con colores
          const totalCol = 3 + informe.sesiones.length;
          if (C === totalCol + 1) { // Presentes
            cell.s.font = { color: { rgb: "27AE60" }, bold: true };
            cell.s.fill = { fgColor: { rgb: "D5F4E6" } };
          } else if (C === totalCol + 2) { // Ausentes
            cell.s.font = { color: { rgb: "E74C3C" }, bold: true };
            cell.s.fill = { fgColor: { rgb: "FADBD8" } };
          } else if (C === totalCol + 3) { // Tardanzas
            cell.s.font = { color: { rgb: "F39C12" }, bold: true };
            cell.s.fill = { fgColor: { rgb: "FCF3CF" } };
          }
        }
      }

      // Porcentaje de asistencia con color condicional
      const lastCol = range.e.c;
      const cell = ws[XLSX.utils.encode_cell({r: R, c: lastCol})];
      if (cell) {
        cell.z = '0.00%';
        if (estudiante.porcentaje < 70) {
          cell.s.fill = { fgColor: { rgb: "F8D7DA" } };
          cell.s.font = { color: { rgb: "721C24" }, bold: true, sz: 11 };
        } else if (estudiante.porcentaje >= 90) {
          cell.s.fill = { fgColor: { rgb: "D4EDDA" } };
          cell.s.font = { color: { rgb: "155724" }, bold: true, sz: 11 };
        } else {
          cell.s.fill = { fgColor: { rgb: "FFF3CD" } };
          cell.s.font = { color: { rgb: "856404" }, bold: true, sz: 11 };
        }
      }
    }

    // Estilo resumen
    const resumenRow = 5 + informe.estudiantes.length + 2;
    for (let i = 0; i < 4; i++) {
      const cell = ws[XLSX.utils.encode_cell({r: resumenRow + i, c: 0})];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "E8F8F5" } },
          alignment: { horizontal: "left", vertical: "center" }
        };
      }
      const valueCell = ws[XLSX.utils.encode_cell({r: resumenRow + i, c: 1})];
      if (valueCell) {
        valueCell.s = {
          font: { bold: true, sz: 11, color: { rgb: "1ABC9C" } },
          fill: { fgColor: { rgb: "E8F8F5" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
        if (i === 3) valueCell.z = '0.00%'; // Formato porcentaje para promedio
      }
    }

    // Combinar celdas
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: range.e.c } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: range.e.c } }
    ];

    // Anchos de columna
    const colWidths = [
      { wch: 5 },
      { wch: 15 },
      { wch: 40 },
      ...informe.sesiones.map(() => ({ wch: 10 })),
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    // Altura de filas
    ws['!rows'] = [
      { hpt: 30 }, // Título
      { hpt: 25 }, // Subtítulo
      { hpt: 20 }, // Fecha
      { hpt: 10 }, // Espacio
      { hpt: 30 }  // Encabezados
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

    const nombreArchivo = `Asistencia_${informe.curso.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  // Función para imprimir
  const imprimirInforme = () => {
    window.print();
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    let presentes = 0, ausentes = 0, tardanzas = 0;
    Object.values(asistencias).forEach(estado => {
      if (estado === 'Presente') presentes++;
      else if (estado === 'Ausente') ausentes++;
      else if (estado === 'Tardanza') tardanzas++;
    });
    return { presentes, ausentes, tardanzas };
  };

  const stats = calcularEstadisticas();

  if (cargando && vista === 'seleccionar') {
    return (
      <div className="asistencia-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="asistencia-container">
      
      {/* VISTA 1: SELECCIONAR CURSO */}
      {vista === 'seleccionar' && (
        <div className="vista-seleccionar">
          <div className="header-simple">
            <h1>📋 Gestión de Asistencia</h1>
            <p>Selecciona un curso para continuar</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="cursos-grid">
            {cursos.map(curso => (
              <div key={curso.asignacion_id} className="curso-card">
                <div className="curso-header">
                  <h3>{curso.curso_nombre}</h3>
                  <span className="badge">{curso.curso_codigo}</span>
                </div>
                <div className="curso-body">
                  <p>Sección: <strong>{curso.seccion_codigo}</strong></p>
                  <p>Estudiantes: <strong>{curso.cantidad_estudiantes}</strong></p>
                </div>
                <div className="curso-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => seleccionarCurso(curso)}
                  >
                    📝 Tomar Asistencia
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => verInforme(curso)}
                  >
                    📊 Ver Informe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 2: TOMAR ASISTENCIA */}
      {vista === 'tomar' && (
        <div className="vista-tomar">
          <div className="header-tomar">
            <div>
              <h1>{cursoSeleccionado.curso_nombre}</h1>
              <p>Sección {cursoSeleccionado.seccion_codigo} • {fecha}</p>
            </div>
            <button className="btn-back" onClick={reiniciar}>
              ← Volver
            </button>
          </div>

          {/* Datos de la sesión */}
          <div className="sesion-form">
            <div className="form-row">
              <div className="form-group">
                <label>📅 Fecha</label>
                <input 
                  type="date" 
                  value={fecha} 
                  onChange={(e) => setFecha(e.target.value)}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>🕐 Hora Inicio</label>
                <input 
                  type="time" 
                  value={horaInicio} 
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>🕑 Hora Fin</label>
                <input 
                  type="time" 
                  value={horaFin} 
                  onChange={(e) => setHoraFin(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>📝 Observaciones (opcional)</label>
              <textarea 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Clase de introducción..."
                rows="2"
              />
            </div>
          </div>

          {/* Estadísticas */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{estudiantes.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item stat-presente">
              <span className="stat-number">{stats.presentes}</span>
              <span className="stat-label">Presentes</span>
            </div>
            <div className="stat-item stat-ausente">
              <span className="stat-number">{stats.ausentes}</span>
              <span className="stat-label">Ausentes</span>
            </div>
            <div className="stat-item stat-tardanza">
              <span className="stat-number">{stats.tardanzas}</span>
              <span className="stat-label">Tardanzas</span>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="acciones-rapidas">
            <button 
              className="btn btn-success"
              onClick={() => marcarTodos('Presente')}
            >
              ✓ Marcar todos presentes
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => marcarTodos('Ausente')}
            >
              ✗ Marcar todos ausentes
            </button>
          </div>

          {/* Tabla de estudiantes */}
          <div className="tabla-container">
            <table className="tabla-asistencia">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Código</th>
                  <th>Nombre Completo</th>
                  <th>Presente</th>
                  <th>Ausente</th>
                  <th>Tardanza</th>
                  <th>% Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((estudiante, index) => (
                  <tr key={estudiante.matricula_id}>
                    <td>{index + 1}</td>
                    <td>{estudiante.codigo_universitario}</td>
                    <td className="nombre">{estudiante.nombres} {estudiante.apellidos}</td>
                    <td>
                      <button
                        className={`btn-estado btn-p ${asistencias[estudiante.matricula_id] === 'Presente' ? 'active' : ''}`}
                        onClick={() => marcarAsistencia(estudiante.matricula_id, 'Presente')}
                      >
                        ✓
                      </button>
                    </td>
                    <td>
                      <button
                        className={`btn-estado btn-a ${asistencias[estudiante.matricula_id] === 'Ausente' ? 'active' : ''}`}
                        onClick={() => marcarAsistencia(estudiante.matricula_id, 'Ausente')}
                      >
                        ✗
                      </button>
                    </td>
                    <td>
                      <button
                        className={`btn-estado btn-at ${asistencias[estudiante.matricula_id] === 'Tardanza' ? 'active' : ''}`}
                        onClick={() => marcarAsistencia(estudiante.matricula_id, 'Tardanza')}
                      >
                        ⏱
                      </button>
                    </td>
                    <td>
                      <span className={`porcentaje ${estudiante.porcentaje_asistencia < 70 ? 'bajo' : ''}`}>
                        {estudiante.porcentaje_asistencia}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {exito && (
            <div className="alert alert-success">
              <span>✅</span>
              <span>¡Asistencia guardada exitosamente!</span>
            </div>
          )}

          <div className="acciones-finales">
            <button 
              className="btn btn-secondary"
              onClick={() => verInforme(cursoSeleccionado)}
              style={{ marginRight: '1rem' }}
            >
              📊 Ver Informe de Asistencia
            </button>
            <button 
              className="btn btn-save"
              onClick={guardarAsistencia}
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : '💾 Guardar Asistencia'}
            </button>
          </div>
        </div>
      )}

      {/* VISTA 3: INFORME DE ASISTENCIA */}
      {vista === 'informe' && informe && (
        <div className="vista-informe">
          <div 
            className="header-informe"
            data-fecha={new Date().toLocaleDateString('es-ES')}
          >
            <div>
              <h1>📊 Informe de Asistencia</h1>
              <p>{informe.curso.nombre} - Sección {informe.curso.seccion}</p>
              <p className="fecha-impresion">
                Generado el: {new Date().toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={reiniciar}>
                ← Volver
              </button>
              <button className="btn btn-primary" onClick={imprimirInforme}>
                🖨️ Imprimir
              </button>
              <button className="btn btn-success" onClick={exportarExcel}>
                📥 Exportar Excel
              </button>
            </div>
          </div>

          <div className="informe-container">
            <table className="tabla-informe">
              <thead>
                <tr>
                  <th rowSpan="2">N°</th>
                  <th rowSpan="2">Código</th>
                  <th rowSpan="2">Nombre Completo</th>
                  <th colSpan={informe.sesiones.length}>Fechas de Clase</th>
                  <th rowSpan="2">Total</th>
                  <th rowSpan="2">Presente</th>
                  <th rowSpan="2">Ausente</th>
                  <th rowSpan="2">Tardanza</th>
                  <th rowSpan="2">% Asistencia</th>
                </tr>
                <tr>
                  {informe.sesiones.map((sesion, index) => (
                    <th key={sesion.sesion_id} className="fecha-header">
                      {new Date(sesion.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {informe.estudiantes.map((estudiante, index) => (
                  <tr key={estudiante.matricula_id}>
                    <td>{index + 1}</td>
                    <td>{estudiante.codigo_universitario}</td>
                    <td className="nombre">{estudiante.nombres} {estudiante.apellidos}</td>
                    {informe.sesiones.map(sesion => {
                      const estado = estudiante.asistencias[sesion.sesion_id];
                      return (
                        <td key={sesion.sesion_id} className="celda-estado">
                          {estado === 'Presente' && <span className="icon-presente">✓</span>}
                          {estado === 'Ausente' && <span className="icon-ausente">✗</span>}
                          {estado === 'Tardanza' && <span className="icon-tardanza">⏱</span>}
                          {!estado && <span className="icon-vacio">-</span>}
                        </td>
                      );
                    })}
                    <td><strong>{estudiante.total_sesiones}</strong></td>
                    <td className="stat-presente">{estudiante.presentes}</td>
                    <td className="stat-ausente">{estudiante.ausentes}</td>
                    <td className="stat-tardanza">{estudiante.tardanzas}</td>
                    <td>
                      <span className={`porcentaje-badge ${estudiante.porcentaje < 70 ? 'bajo' : ''}`}>
                        {estudiante.porcentaje}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen */}
          <div className="resumen-informe">
            <h3>📈 Resumen General</h3>
            <div className="resumen-stats">
              <div className="resumen-item">
                <span className="resumen-label">Total Sesiones:</span>
                <span className="resumen-value">{informe.sesiones.length}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">Total Estudiantes:</span>
                <span className="resumen-value">{informe.estudiantes.length}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">Promedio Asistencia:</span>
                <span className="resumen-value">
                  {(informe.estudiantes.reduce((sum, e) => sum + e.porcentaje, 0) / informe.estudiantes.length).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TomarAsistencia;