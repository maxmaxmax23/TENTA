// File: src/components/BackupRestore.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";

export default function BackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const slots = [
    { id: "products", name: "Live Products (Firestore)" },
    { id: "currentImport", name: "Current Import Backup" },
    { id: "previousImport", name: "Previous Import Backup" },
  ];

  useEffect(() => {
    const fetchBackups = async () => {
      const arr = [];
      for (const slot of slots) {
        const ref = doc(db, "backups", slot.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          arr.push({ ...slot, ...snap.data() });
        } else {
          arr.push({ ...slot, data: [], timestamp: null, user: null });
        }
      }
      setBackups(arr);
    };
    fetchBackups();
  }, []);

  const restoreBackup = async (backupId) => {
    const backup = backups.find((b) => b.id === backupId);
    if (!backup || !backup.data || backup.data.length === 0) {
      alert("Backup vacío o inexistente.");
      return;
    }

    if (!window.confirm(`⚠️ Restaurar "${backup.name}" sobre productos activos?`)) return;

    setLoading(true);
    setProgress(0);

    try {
      const productsRef = collection(db, "products");
      const total = backup.data.length;
      for (let i = 0; i < total; i++) {
        const item = backup.data[i];
        await setDoc(doc(productsRef, item.id), item);
        setProgress(Math.floor(((i + 1) / total) * 100));
      }

      alert(`✅ Restauración completa: ${total} productos cargados.`);
    } catch (err) {
      console.error(err);
      alert("❌ Error al restaurar backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-900 text-gold rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Restaurar Backup</h2>

      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-gold h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {backups.map((b) => (
        <div
          key={b.id}
          className="mb-4 p-3 bg-gray-800 rounded-lg flex justify-between items-center"
        >
          <div>
            <p className="font-semibold">{b.name}</p>
            {b.timestamp && (
              <p className="text-sm text-gray-400">
                {b.user} | {new Date(b.timestamp).toLocaleString()}
              </p>
            )}
          </div>
          {b.id !== "products" && (
            <button
              onClick={() => restoreBackup(b.id)}
              className="px-3 py-1 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
            >
              Restaurar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
