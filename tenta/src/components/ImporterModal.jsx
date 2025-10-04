// File: src/components/ImporterModal.jsx
import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js"; // Incremental patch: correct import
import PropTypes from "prop-types";

export default function ImporterModal({ onClose, incrementWrites, mergedData }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ written: 0, skipped: 0, outOfTime: 0 });

  // Throttle function to limit write speed
  const throttle = (fn, delay) => {
    let lastCall = 0;
    return async (...args) => {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        await new Promise((res) => setTimeout(res, delay - (now - lastCall)));
      }
      lastCall = new Date().getTime();
      return fn(...args);
    };
  };

  const writeBatchToFirestore = throttle(async (batchData) => {
    const batch = writeBatch(db);
    batchData.forEach((item) => {
      const docRef = doc(collection(db, "products"), item.productId);
      batch.set(docRef, {
        description: item.description,
        barcodes: item.barcodes,
        price: item.price,
        vigencia: item.vigencia,
      });
    });
    await batch.commit();
  }, 500); // 500ms between batches

  const handleImport = async () => {
    if (!mergedData || mergedData.length === 0) {
      alert("No hay datos para importar.");
      return;
    }

    try {
      setLoading(true);
      let written = 0;
      let skipped = 0;
      let outOfTime = 0;

      // Split mergedData into batches to minimize Firestore writes
      const batchSize = 50;
      for (let i = 0; i < mergedData.length; i += batchSize) {
        const batchChunk = mergedData.slice(i, i + batchSize);

        // Count items
        batchChunk.forEach((item) => {
          if (!item.vigencia || !item.price) skipped++;
          else written++;
        });

        await writeBatchToFirestore(batchChunk);
      }

      setStats({ written, skipped, outOfTime });
      incrementWrites(written);
      alert(`Importación finalizada. Productos escritos: ${written}`);
    } catch (error) {
      console.error("Error importando a Firebase:", error);
      alert("Error durante la importación. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-3">Importar Datos a Firebase</h2>

        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-gold text-black py-2 rounded mb-4 font-semibold"
        >
          {loading ? "Importando..." : "Procesar e Importar"}
        </button>

        <div className="text-sm mb-2">
          <p>✅ A escribir: {stats.written}</p>
          <p>⚠️ Ignorados: {stats.skipped}</p>
          <p>⏰ Fuera de vigencia: {stats.outOfTime}</p>
        </div>

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

ImporterModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  incrementWrites: PropTypes.func.isRequired,
  mergedData: PropTypes.array.isRequired,
};
