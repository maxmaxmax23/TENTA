return (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
    <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
      <h2 className="text-lg font-bold mb-4">Importar Excel</h2>

      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-gold h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-4">
            <label className="block font-medium mb-1">
              Archivo Equivalencias (SKU ↔ ID):
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setEquivalenciasFile(e.target.files?.[0])}
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-1">
              Archivo Precios (ID ↔ Detalles):
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setPreciosFile(e.target.files?.[0])}
            />
          </div>

          <button
            onClick={importExcelToFirestore}
            disabled={!equivalenciasFile || !preciosFile}
            className="w-full px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50"
          >
            Importar
          </button>

          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  </div>
);
