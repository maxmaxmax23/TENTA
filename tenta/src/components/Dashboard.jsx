// src/components/Dashboard.jsx
import React, { useState } from "react";
import ScannerModal from "./ScannerModal.jsx";
import ImporterModal from "./ImporterModal.jsx";
import BackupManager from "./BackupManager.jsx";

export default function Dashboard({ onScan, user }) {
  const [showScanner, setShowScanner] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [firebaseWrites, setFirebaseWrites] = useState(0);

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowScanner(true)} className="px-4 py-2 bg-gold text-black rounded">Escanear</button>
        <button onClick={() => setShowImporter(true)} className="px-4 py-2 bg-gray-700 text-gold rounded">Importar</button>
        <button onClick={() => setShowBackups(true)} className="px-4 py-2 bg-red-700 text-black rounded">Backups</button>
      </div>

      <p className="text-sm text-gray-300">Writes acumulados: {firebaseWrites}</p>

      {showScanner && <ScannerModal onScan={(code) => { setShowScanner(false); onScan(code); }} />}

      {showImporter && (
        <ImporterModal
          user={user}
          initialWrites={firebaseWrites}
          onWritesUpdate={(c) => setFirebaseWrites(c)}
          onClose={() => setShowImporter(false)}
        />
      )}

      {showBackups && (
        <BackupManager
          user={user}
          onClose={() => setShowBackups(false)}
        />
      )}
    </div>
  );
}
