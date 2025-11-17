import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // si usas shadcn/ui
import { Loader2 } from "lucide-react";

export default function MisCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 ID del alumno logueado (de tu contexto o localStorage)
  const alumnoId = localStorage.getItem("alumno_id"); // asegúrate de guardar esto al iniciar sesión

  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/alumno/mis-cursos/${alumnoId}`);
        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error(data.error || "Error desconocido");
        }

        setCursos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarCursos();
  }, [alumnoId]);

  // -----------------------------
  // 🧠 Estado de carga
  // -----------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader2 className="animate-spin w-6 h-6 mb-2" />
        Cargando tus cursos matriculados...
      </div>
    );
  }

  // -----------------------------
  // ⚠️ Error
  // -----------------------------
  if (error) {
    return (
      <div className="text-center text-red-600 font-medium mt-6">
        ❌ {error}
      </div>
    );
  }

  // -----------------------------
  // 📚 Sin cursos
  // -----------------------------
  if (cursos.length === 0) {
    return (
      <div className="text-center text-gray-500 font-medium mt-6">
        No tienes cursos matriculados actualmente.
      </div>
    );
  }

  // -----------------------------
  // ✅ Mostrar cursos
  // -----------------------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        Mis cursos matriculados
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cursos.map((curso) => (
          <Card key={curso.asignacion_id} className="shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <h2 className="text-lg font-semibold text-indigo-600">{curso.curso}</h2>
              <p className="text-sm text-gray-500">Código: {curso.codigo_curso}</p>
            </CardHeader>

            <CardContent>
              <p><strong>Sección:</strong> {curso.seccion}</p>
              <p><strong>Docente:</strong> {curso.docente}</p>
              <p><strong>Día:</strong> {curso.dia}</p>
              <p><strong>Horario:</strong> {curso.hora_inicio} - {curso.hora_fin}</p>
              <p><strong>Aula:</strong> {curso.aula} ({curso.pabellon})</p>
              <p><strong>Periodo:</strong> {curso.periodo}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
