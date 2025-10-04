import React, { useState } from "react";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { firestore } from "../firebase.js";

export default function ImporterModal({ onClose, incrementWrites, mergedDataQueue, clearQueue }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ written: 0, skipped: 0 });

  const handleImport = async () => {
    if (!mergedDataQueue || mergedDataQueue.length === 0) {
      alert("No hay datos en la cola para importar.");
      return;
    }

    setLoading(true);
    let written = 0;
    let skipped = 0;
    const batchSize = 50; // throttling
    try {
      for (let i = 0; i < mergedDataQueue.length; i += batchSize) {
        const batch = writeBatch(firestore);
        const slice = mergedDataQueue.slice(i, i + batchSize);

        slice.forEach((item) => {
          if (!item.productId) {
            skipped++;
            return;
          }
          const docRef = doc(collection(firestore, "products"), item.productId);
          batch.set(docRef, item, { merge: true });
          written++;
        });

        await batch.commit();
        setStats({ written, skipped });
        incrementWrites(written);
      }

      alert(`Importación completa: ${written} escritos, ${skipped} ignorados.`);
      clearQueue();
    } catch (error) {
      console.error("Error importando a Firebase:", error);
      alert("Error durante la importación. Ver consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md flex flex-col">
        <h2 className="text-xl font-bold mb-3">Importar a Firebase</h2>

        <div className="mb-4">
          <p>Productos en cola: {mergedDataQueue.length}</p>
          <p>✅ Escritos: {stats.written}</p>
          <p>⚠️ Ignorados: {stats.skipped}</p>
        </div>

        <button
          onClick={handleImport}
          disabled={loading || mergedDataQueue.length === 0}
          className="bg-gold text-black py-2 rounded font-semibold mb-2"
        >
          {loading ? "Importando..." : "Importar ahora"}
        </button>

        <button
          onClick={onClose}
          className="bg-gray-700 text-gold py-2 rounded hover:bg-gray-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
