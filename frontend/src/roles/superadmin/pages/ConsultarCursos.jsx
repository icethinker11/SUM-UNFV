import { useEffect, useState } from "react";
import "../styles/consultar-cursos.css";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export default function ConsultarCursos() {
  const [cursos, setCursos] = useState([]);
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const obtenerCursos = async (ciclo = "") => {
    try {
      const url = ciclo
        ? `http://localhost:5000/curso/listar?ciclo=${ciclo}`
        : "http://localhost:5000/curso/listar";

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setCursos(data);
        setMensaje(
          data.length
            ? ""
            : "⚠️ No se encontraron cursos para el ciclo seleccionado."
        );
      } else {
        setMensaje("❌ Error al obtener los cursos.");
      }
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error de conexión con el servidor.");
    }
  };

  useEffect(() => {
    obtenerCursos(); // Carga inicial
  }, []);

  const handleFiltro = (e) => {
    const cicloSeleccionado = e.target.value;
    setFiltroCiclo(cicloSeleccionado);
    obtenerCursos(cicloSeleccionado);
  };

  // 🖨️ Vista previa sin sidebar
  const handleVistaPrevia = () => {
    const contenido = document.getElementById("area-imprimir").innerHTML;
    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <title>Vista Previa - Malla Curricular</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
            .encabezado-informe {
              display: flex; align-items: center; gap: 20px; margin-bottom: 20px;
              border-bottom: 3px solid #004aad; padding-bottom: 10px;
            }
            .encabezado-informe img { width: 70px; height: 70px; }
            .encabezado-informe h3 { margin: 0; font-size: 20px; color: #004aad; }
            .encabezado-informe p { margin: 2px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background-color: #004aad; color: white; }
            tr:nth-child(even) { background-color: #f2f6ff; }
            h4 { text-align: center; color: #004aad; margin-top: 20px; }
          </style>
        </head>
        <body>
          ${contenido}
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  // 📄 Exportar PDF profesional
  const handleExportPDF = () => {
    const elemento = document.getElementById("area-imprimir");
    const fechaHora = new Date().toLocaleString("es-PE", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const opt = {
      margin: [10, 10, 15, 10],
      filename: `Cursos_${filtroCiclo || "Todos"}_${fechaHora}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(elemento)
      .save()
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "PDF generado con éxito 📄",
          text: "El archivo se ha guardado correctamente en tus descargas.",
          confirmButtonColor: "#004aad",
        });
      });
  };

  // 📊 Exportar Excel
  const handleExportExcel = () => {
    const tabla = document.getElementById("tabla-cursos");
    const ws = XLSX.utils.table_to_sheet(tabla);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cursos");
    const nombreArchivo = `Cursos_${filtroCiclo || "Todos"}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);

    Swal.fire({
      icon: "success",
      title: "Excel generado con éxito 📊",
      text: `El archivo "${nombreArchivo}" se ha guardado correctamente.`,
      confirmButtonColor: "#004aad",
    });
  };

  return (
    <div className="consultar-cursos">
      <h2>📚 Consultar Malla Curricular</h2>

      <div className="filtros no-imprimir">
        <label>
          Filtrar por ciclo:
          <select value={filtroCiclo} onChange={handleFiltro}>
            <option value="">Todos los ciclos</option>
            {[..."ABCDEFGHIJ"]
              .map((_, i) => (
                <option key={i} value={["I","II","III","IV","V","VI","VII","VIII","IX","X"][i]}>
                  {["I","II","III","IV","V","VI","VII","VIII","IX","X"][i]}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="acciones no-imprimir">
        <button onClick={handleVistaPrevia} className="btn-imprimir">
          🖨️ Imprimir Vista Previa
        </button>
        <button onClick={handleExportPDF} className="btn-pdf">
          📄 Exportar PDF
        </button>
        <button onClick={handleExportExcel} className="btn-excel">
          📊 Exportar Excel
        </button>
      </div>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      {/* 🖨️ Contenido imprimible */}
      <div id="area-imprimir" className="tabla-container">
        <div className="encabezado-informe">
          <img src="/logo-universidad.png" alt="Logo" className="logo-universidad" />
          <div>
            <h3>Universidad Nacional Federico Villarreal</h3>
            <p>Facultad de Ingeniería de Sistemas e Informática</p>
            <p>
              Fecha de impresión:{" "}
              {new Date().toLocaleString("es-PE", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        <h4 className="titulo-ciclo">
          {filtroCiclo ? `Ciclo ${filtroCiclo}` : "Todos los Ciclos"}
        </h4>

        <table id="tabla-cursos" className="tabla-cursos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Créditos</th>
              <th>Ciclo</th>
              <th>Horas Teóricas</th>
              <th>Horas Prácticas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((curso) => (
              <tr key={curso.curso_id}>
                <td>{curso.codigo}</td>
                <td>{curso.nombre}</td>
                <td>{curso.creditos}</td>
                <td>{curso.ciclo}</td>
                <td>{curso.horas_teoricas}</td>
                <td>{curso.horas_practicas}</td>
                <td>{curso.estado ? "Activo" : "Inactivo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
