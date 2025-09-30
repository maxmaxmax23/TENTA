// File: src/components/Dashboard.jsx
import { useState } from "react";

export default function Dashboard({ onScan, onOpenScanner }) {
  const [importing, setImporting] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-gold">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4">
        {/* Scan button */}
        <button
          onClick={onOpenScanner}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Escanear
        </button>

        {/* Import JSON button */}
        <button
          onClick={() => setImporting(true)}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Importar JSON
        </button>

        {/* Export button (placeholder for now) */}
        <button
          onClick={() => alert("Exportar JSON/Excel aún no implementado.")}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Exportar
        </button>

        {/* Future inventory button */}
        <button
          onClick={() => alert("Inventario próximamente.")}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Inventario
        </button>
      </div>

      {/* Importer Modal (placeholder) */}
      {importing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-96 text-black shadow-xl">
            <h2 className="text-lg font-bold mb-4">Importar JSON</h2>
            <input
              type="file"
              accept="application/json"
              className="mb-4 w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const json = JSON.parse(ev.target.result);
                      console.log("Imported JSON:", json);
                      // TODO: sync to Firestore here
                      alert("JSON importado correctamente.");
                    } catch (err) {
                      alert("Error al importar JSON.");
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <button
              onClick={() => setImporting(false)}
              className="mt-4 px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
