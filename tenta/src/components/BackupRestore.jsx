// File: src/components/BackupRestore.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export default function BackupRestore({ onClose }) {
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchBackups = async () => {
      try {
        const backupsCol = collection(db, "backups");
        const snapshot = await getDocs(backupsCol);
        const backupsList = snapshot.docs.map((d) => ({
          id: d.id,
          timestamp: d.data().timestamp,
          data: d.data().data,
        }));
        backupsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setBackups(backupsList);
      } catch (err) {
        console.error("Error fetching backups:", err);
        alert("Error al obtener backups.");
      }
    };
    fetchBackups();
  }, []);

  const restoreBackup = async () => {
    if (!selectedBackup) return;
    if (!window.confirm("¿Sobrescribir productos actuales con este backup?")) return;

    setLoading(true);
    setProgress(0);

    try {
      const productsRef = collection(db, "products");
      const data = selectedBackup.data;

      for (let i = 0; i < data.length; i++) {
        await setDoc(doc(productsRef, data[i].id), data[i]);
        setProgress(Math.floor(((i + 1) / data.length) * 100));
      }

      alert(`✅ Backup restaurado: ${data.length} productos cargados.`);
      onClose();
    } catch (err) {
      console.error("Error restaurando backup:", err);
      alert("❌ Error al restaurar backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
        <h2 className="text-lg font-bold mb-4">Restaurar Backup</h2>

        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-gold h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {!loading && (
          <>
            {backups.length === 0 ? (
              <p>No hay backups disponibles.</p>
            ) : (
              <select
                className="w-full mb-4 border px-2 py-1 rounded"
                onChange={(e) =>
                  setSelectedBackup(backups.find((b) => b.id === e.target.value))
                }
              >
                <option value="">Selecciona un backup</option>
                {backups.map((b) => (
                  <option key={b.id} value={b.id}>
                    {new Date(b.timestamp).toLocaleString()}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={restoreBackup}
              disabled={!selectedBackup}
              className="w-full py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50"
            >
              Restaurar
            </button>

            <button
              onClick={onClose}
              className="mt-4 w-full py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
