function RegistrarNota() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📝 Registrar Calificación</h2>
      <form className="space-y-4">
        <input className="border p-2 w-full" placeholder="Código Alumno" />
        <input
          className="border p-2 w-full"
          placeholder="Evaluación (Ej: Parcial)"
        />
        <input
          className="border p-2 w-full"
          placeholder="Nota (0-20)"
          type="number"
        />
        <button className="bg-red-900 text-white px-4 py-2 rounded">
          Guardar
        </button>
      </form>
    </div>
  );
}
export default RegistrarNota;
