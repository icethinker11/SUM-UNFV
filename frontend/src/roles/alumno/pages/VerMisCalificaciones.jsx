import { useEffect, useState } from "react";
import "../styles/ver-calificaciones.css";
const VerMisCalificaciones = ({ estudianteId }) => {
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estudianteId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/alumno/mis-calificaciones/${estudianteId}`
        );

        const data = await res.json();
        setCalificaciones(data.calificaciones || []);
      } catch (error) {
        console.error("Error cargando calificaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [estudianteId]);

  if (loading) return <p className="vmc-loading">Cargando...</p>;

  return (
    <div className="vmc-container">
      <h2 className="vmc-title">📘 Mis Calificaciones</h2>

      {calificaciones.length === 0 ? (
        <p className="vmc-empty">No hay calificaciones registradas.</p>
      ) : (
        calificaciones.map((item) => (
          <div key={item.id} className="vmc-card">
            
            <div className="vmc-header">
              <h3>{item.curso_nombre} ({item.curso_codigo})</h3>
              <span className="vmc-docente">👨‍🏫 {item.docente}</span>
            </div>

            <div className="vmc-notas">
              <p><strong>Prácticas:</strong> {item.practicas ?? "-"}</p>
              <p><strong>Parcial:</strong> {item.parcial ?? "-"}</p>
              <p><strong>Final:</strong> {item.final ?? "-"}</p>
              <p><strong>Sustitutorio:</strong> {item.sustitutorio ?? "-"}</p>
              <p><strong>Aplazado:</strong> {item.aplazado ?? "-"}</p>

              <p className="vmc-promedio">
                Promedio final:  
                <strong> {item.promedio ?? "-"}</strong>
              </p>
            </div>

            <p className="vmc-estado">
              Estado: <strong>{item.estado}</strong>
            </p>

          </div>
        ))
      )}
    </div>
  );
};

export default VerMisCalificaciones;
