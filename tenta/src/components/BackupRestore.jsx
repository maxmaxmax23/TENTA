import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function RestoreBackup({ user, onClose }) {
  const [backups, setBackups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchBackups = async () => {
      const backupCol = collection(db, "backups/history");
      const snapshot = await getDocs(backupCol);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.id < b.id ? 1 : -1));
      setBackups(list);
    };
    fetchBackups();
  }, []);

  const handleRestore = async () => {
    if (!selected) return;
    setProcessing(true);
    setLog([]);

    try {
      const backupDoc = doc(db, "backups/history", selected);
      const snapshot = await getDoc(backupDoc);
      if (!snapshot.exists()) {
        setLog((prev) => [...prev, "Backup no encontrado"]);
        return;
      }

      const products = snapshot.data().products || [];
      for (let i = 0; i < products.length; i++) {
        const item = products[i];
        await setDoc(doc(db, "products", item.id), item);
        setLog((prev) => [...prev, `Restaurado: ${item.id} (${i + 1}/${products.length})`]);
      }

      alert(`Restauración completa: ${products.length} items`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error durante la restauración");
    } finally {
      setProcessing(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 overflow-auto">
      <div className="w-11/12 max-w-lg bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Restaurar Backup</h2>
        <select
          value={selected || ""}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-black border border-gold text-gold"
        >
          <option value="" disabled>Selecciona un backup</option>
          {backups.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} | usuario: {b.user}
            </option>
          ))}
        </select>
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!selected || processing}
            className="flex-1 py-2 bg-green-600 text-black rounded-lg hover:bg-green-500 transition disabled:opacity-50"
          >
            Restaurar
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>

        {showConfirm && (
          <div className="bg-black bg-opacity-80 p-4 rounded space-y-4 border border-gold">
            <p className="text-sm">
              ⚠️ Estás a punto de sobrescribir todos los productos actuales con el backup seleccionado. Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleRestore}
                className="flex-1 py-2 bg-red-700 text-black rounded-lg hover:bg-red-600 transition"
              >
                Confirmar Restauración
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 h-40 overflow-auto bg-black bg-opacity-50 p-2 rounded">
          {log.map((line, idx) => (
            <p key={idx} className="text-xs">{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
