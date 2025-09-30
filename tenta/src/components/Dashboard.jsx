import { useState } from "react";
import ScannerModal from "./ScannerModal.jsx";
import ExcelImporter from "./ExcelImporter.jsx";

export default function Dashboard({ onScan, user }) {
  const [showScanner, setShowScanner] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [writesCounter, setWritesCounter] = useState(0);

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
        >
          Escanear
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="px-4 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Importar
        </button>
      </div>

      <p>Firebase writes acumulados: {writesCounter}</p>

      {showScanner && (
        <ScannerModal
          onScan={(code) => {
            setShowScanner(false);
            onScan(code);
          }}
        />
      )}

      {showImporter && (
        <ExcelImporter
          user={user}
          initialWrites={writesCounter}
          onWritesUpdate={(newWrites) => setWritesCounter((prev) => prev + newWrites)}
          onClose={() => setShowImporter(false)}
        />
      )}
    </div>
  );
}
