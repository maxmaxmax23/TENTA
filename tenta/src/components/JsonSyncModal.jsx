// File: src/components/JsonSyncModal.jsx
import { useState } from "react";

export default function JsonSyncModal({ onClose, syncFunction }) {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setLog("Sincronizando...");

    try {
      const result = await syncFunction((msg) => setLog(msg));
      setLog(`✅ Sincronización completa: ${result}`);
    } catch (err) {
      console.error(err);
      setLog("❌ Error durante la sincronización");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-md bg-gray-900 p-6 rounded-xl shadow-lg text-gold space-y-4">
        <h2 className="text-xl font-bold">Sincronización JSON</h2>
        {log && <p className="text-sm">{log}</p>}
        <div className="flex space-x-2">
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {loading ? "Sincronizando..." : "Iniciar Sync"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
