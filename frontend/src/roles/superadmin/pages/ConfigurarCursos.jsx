function ConfigurarCursos() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📘 Configurar Cursos</h2>
      <form className="space-y-4">
        <input className="border p-2 w-full" placeholder="Código del curso" />
        <input className="border p-2 w-full" placeholder="Nombre del curso" />
        <input className="border p-2 w-full" placeholder="Créditos" />
        <input className="border p-2 w-full" placeholder="Ciclo recomendado" />
        <button className="bg-black text-white px-4 py-2 rounded">Guardar</button>
      </form>
    </div>
  );
}
export default ConfigurarCursos;
