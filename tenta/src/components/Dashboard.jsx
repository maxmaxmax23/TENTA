// File: src/components/Dashboard.jsx
import { useState } from "react";
import ImporterModal from "./ImporterModal";
import ScannerModal from "./ScannerModal";
import BackupManager from "./BackupManager";

export default function Dashboard() {
  const [showImporter, setShowImporter] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-gold p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setShowScanner(true)}
          className="bg-gold text-black p-4 rounded-lg hover:bg-yellow-500 transition"
        >
          Abrir Scanner
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="bg-green-600 text-black p-4 rounded-lg hover:bg-green-500 transition"
        >
          Importar / Previsualizar
        </button>

        <button
          onClick={() => setShowBackup(true)}
          className="bg-gray-700 text-gold p-4 rounded-lg hover:bg-gray-600 transition"
        >
          Backup / Restaurar
        </button>
      </div>

      {showImporter && <ImporterModal onClose={() => setShowImporter(false)} />}
      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} />}
      {showBackup && <BackupManager onClose={() => setShowBackup(false)} />}
    </div>
  );
}
