// File: src/components/Dashboard.jsx
import { useState } from "react";
import ScannerModal from "./ScannerModal.jsx";
import ExcelImporter from "./ExcelImporter.jsx";
import BackupRestore from "./BackupRestore.jsx";

export default function Dashboard({ onScan }) {
  const [showScanner, setShowScanner] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-start p-6 space-y-4 overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => setShowScanner(true)}
          className="w-full py-3 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
        >
          Escanear
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="w-full py-3 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Importar Excel
        </button>

        <button
          onClick={() => setShowBackup(true)}
          className="w-full py-3 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Restaurar Backup
        </button>
      </div>

      {/* Modals / overlays */}
      {showScanner && <ScannerModal onScan={onScan} />}
      {showImporter && <ExcelImporter onClose={() => setShowImporter(false)} />}
      {showBackup && <BackupRestore />}
    </div>
  );
}
