// File: src/components/Dashboard.jsx
import { useState } from "react";
import ExcelImporter from "./ExcelImporter.jsx";
import BackupRestore from "./BackupRestore.jsx";

export default function Dashboard({ onOpenScanner }) {
  const [importing, setImporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-gold">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={onOpenScanner}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Escanear
        </button>

        <button
          onClick={() => setImporting(true)}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Importar
        </button>

        <button
          onClick={() => setRestoring(true)}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Restaurar Backup
        </button>

        <button
          onClick={() => alert("Exportar JSON/Excel aún no implementado.")}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Exportar
        </button>

        <button
          onClick={() => alert("Inventario próximamente.")}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Inventario
        </button>
      </div>

      {importing && <ExcelImporter onClose={() => setImporting(false)} />}
      {restoring && <BackupRestore onClose={() => setRestoring(false)} />}
    </div>
  );
}
