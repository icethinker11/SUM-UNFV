function SolicitarMatricula() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📝 Solicitar Matrícula</h2>
      <form className="space-y-4">
        <input className="border p-2 w-full" placeholder="Código del curso" />
        <button className="bg-orange-600 text-white px-4 py-2 rounded">Enviar Solicitud</button>
      </form>
    </div>
  );
}
export default SolicitarMatricula;
