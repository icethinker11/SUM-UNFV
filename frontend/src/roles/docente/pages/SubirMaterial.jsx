function SubirMaterial() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📂 Subir Material Didáctico</h2>
      <form className="space-y-4">
        <input
          className="border p-2 w-full"
          placeholder="Título del material"
        />
        <textarea
          className="border p-2 w-full"
          placeholder="Descripción"
        ></textarea>
        <input className="border p-2 w-full" type="file" />
        <button className="bg-red-900 text-white px-4 py-2 rounded">
          Subir
        </button>
      </form>
    </div>
  );
}
export default SubirMaterial;
