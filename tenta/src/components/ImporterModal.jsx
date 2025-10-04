// File: src/components/ImporterModal.jsx
import React, { useState } from "react";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js"; // Ensure db is exported from firebase.js

export default function ImporterModal({ onClose, mergedData, incrementWrites }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ written: 0, skipped: 0, outOfTime: 0 });
  const [errorLogs, setErrorLogs] = useState([]);

  const MAX_BATCH = 500;

  const isDataChanged = (existingDoc, newDoc) => {
    if (!existingDoc) return true;
    return (
      existingDoc.price !== newDoc.price ||
      existingDoc.description !== newDoc.description ||
      JSON.stringify(existingDoc.barcodes) !== JSON.stringify(newDoc.barcodes)
    );
  };

  const importData = async () => {
    if (!mergedData || mergedData.length === 0) return;

    setLoading(true);
    let written = 0, skipped = 0, outOfTime = 0;
    const errors = [];
    const batches = [];

    try {
      // Split into batches
      for (let i = 0; i < mergedData.length; i += MAX_BATCH) {
        const batch = writeBatch(db);
        const chunk = mergedData.slice(i, i + MAX_BATCH);

        for (const row of chunk) {
          try {
            // Check date first
            const vigenciaDate = new Date(row.vigencia.split("/").reverse().join("-"));
            const now = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            if (vigenciaDate < oneYearAgo) {
              outOfTime++;
              continue;
            }

            const docRef = doc(db, "products", row.productId);
            const existing = await getDoc(docRef);
            const existingData = existing.exists() ? existing.data() : null;

            if (!isDataChanged(existingData, row)) {
              skipped++;
              continue;
            }

            batch.set(docRef, row, { merge: true });
            written++;
          } catch (err) {
            errors.push({ row, error: err.message });
          }
        }

        batches.push(batch);
      }

      // Execute batches sequentially (throttle)
      for (const b of batches) {
        await b.commit();
      }

      setStats({ written, skipped, outOfTime });
      incrementWrites(written);
      setErrorLogs(errors);
    } catch (err) {
      console.error("Error importing:", err);
      alert("Error al importar los datos. Ver consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-3">Importar Datos a Firebase</h2>

        <button
          onClick={importData}
          disabled={loading}
          className="bg-gold text-black py-2 rounded mb-4 font-semibold"
        >
          {loading ? "Importando..." : "Importar Merged Data"}
        </button>

        <div className="text-sm mb-2">
          <p>✅ A escribir: {stats.written}</p>
          <p>⚠️ Ignorados (sin cambio): {stats.skipped}</p>
          <p>⏰ Fuera de vigencia: {stats.outOfTime}</p>
        </div>

        {errorLogs.length > 0 && (
          <div className="overflow-y-auto max-h-32 border border-red-500 rounded p-1 text-xs">
            {errorLogs.map((e, i) => (
              <p key={i} className="text-red-400">{`ID: ${e.row.productId}, Error: ${e.error}`}</p>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 bg-gray-700 text-gold py-2 rounded hover:bg-gray-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
