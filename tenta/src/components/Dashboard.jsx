// File: src/components/Dashboard.jsx
import { useState } from "react";
import ScannerModal from "./ScannerModal.jsx";
import JSONImporter from "./JSONImporter.jsx";

export default function Dashboard({ onScan }) {
  const [showScanner, setShowScanner] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  // placeholders for future export modals
  const [showExportJSON, setShowExportJSON] = useState(false);
  const [showExportExcel, setShowExportExcel] = useState(false);

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-start p-6 space-y-6">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => setShowScanner(true)}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Escanear
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="px-4 py-3 bg-gray-800 text-gold rounded-2xl font-semibold hover:bg-gray-700 transition shadow-lg"
        >
          Importar JSON
        </button>

        <button
          onClick={() => setShowExportJSON(true)}
          className="px-4 py-3 bg-gray-800 text-gold rounded-2xl font-semibold hover:bg-gray-700 transition shadow-lg"
        >
          Exportar JSON
        </button>

        <button
          onClick={() => setShowExportExcel(true)}
          className="px-4 py-3 bg-gray-800 text-gold rounded-2xl font-semibold hover:bg-gray-700 transition shadow-lg"
        >
          Exportar Excel
        </button>
      </div>

      {/* Future section: inventory, categories, etc. */}
      <div className="mt-8 w-full max-w-md text-center text-sm text-gray-400">
        Próximamente: Inventario, Categorías, Multiusuario
      </div>

      {/* Modals */}
      {showScanner && <ScannerModal onScan={onScan} />}
      {showImporter && <JSONImporter onClose={() => setShowImporter(false)} />}
      {showExportJSON && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-xl text-gold shadow-lg">
            <p>Exportar a JSON (próximamente)</p>
            <button
              onClick={() => setShowExportJSON(false)}
              className="mt-4 px-4 py-2 bg-gold text-black rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {showExportExcel && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-xl text-gold shadow-lg">
            <p>Exportar a Excel (próximamente)</p>
            <button
              onClick={() => setShowExportExcel(false)}
              className="mt-4 px-4 py-2 bg-gold text-black rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
