// File: src/components/Dashboard.jsx
import { useState } from "react";
import ScannerModal from "./ScannerModal.jsx";
import ProductModal from "./ProductModal.jsx";
import ImporterModal from "./ImporterModal.jsx";
import BackupManager from "./BackupManager.jsx";
import JsonSyncModal from "./JsonSyncModal.jsx";

export default function Dashboard({ onScan }) {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showSync, setShowSync] = useState(false);

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-start p-4 space-y-4 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
        >
          Escanear Producto
        </button>
        <button
          onClick={() => setShowImporter(true)}
          className="px-4 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Importar Productos
        </button>
        <button
          onClick={() => setShowBackup(true)}
          className="px-4 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Crear Backup
        </button>
        <button
          onClick={() => setShowSync(true)}
          className="px-4 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Sincronizar JSON
        </button>
      </div>

      {/* Main Panels */}
      {showScanner && (
        <ScannerModal
          onScan={(code) => {
            setScannedCode(code);
            setShowScanner(false);
          }}
        />
      )}

      {scannedCode && (
        <ProductModal
          code={scannedCode}
          onClose={() => setScannedCode(null)}
        />
      )}

      {showImporter && (
        <ImporterModal onClose={() => setShowImporter(false)} />
      )}

      {showBackup && (
        <div className="w-full max-w-md">
          <BackupManager />
          <button
            onClick={() => setShowBackup(false)}
            className="mt-2 w-full py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cerrar Backup
          </button>
        </div>
      )}

      {showSync && (
        <JsonSyncModal
          onClose={() => setShowSync(false)}
          syncFunction={async (logCallback) => {
            logCallback("Simulando sincronización...");
            // TODO: implement GitHub/Firebase sync
            await new Promise((res) => setTimeout(res, 1500));
            return "OK";
          }}
        />
      )}
    </div>
  );
}
