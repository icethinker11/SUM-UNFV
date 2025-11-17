import { useEffect, useState } from "react";
import axios from "axios";

function VerMisAsignaciones({ usuario }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario || !usuario.alumno_id) return;

    const fetchAsignaciones = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:5000/alumno/mis-asignaciones/${usuario.alumno_id}`
        );
        setAsignaciones(res.data);
      } catch (err) {
        console.error("Error al cargar asignaciones:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAsignaciones();
  }, [usuario]);

  if (loading) {
    return <p>Cargando tus cursos matriculados...</p>;
  }

  if (asignaciones.length === 0) {
    return <p>No estás matriculado en ninguna asignación.</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📚 Mis Asignaciones</h2>
      <table className="min-w-full bg-white border rounded-lg">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-left">Curso</th>
            <th className="p-3 text-left">Sección</th>
            <th className="p-3 text-left">Docente</th>
            <th className="p-3 text-left">Aula</th>
            <th className="p-3 text-left">Horario</th>
          </tr>
        </thead>
        <tbody>
          {asignaciones.map((a) => (
            <tr key={a.asignacion_id} className="border-t hover:bg-gray-100">
              <td className="p-3">{a.curso}</td>
              <td className="p-3">{a.seccion}</td>
              <td className="p-3">{a.docente}</td>
              <td className="p-3">{a.aula}</td>
              <td className="p-3">
                {a.dia} {a.hora_inicio} - {a.hora_fin}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VerMisAsignaciones;
