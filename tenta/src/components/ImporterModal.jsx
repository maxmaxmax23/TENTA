// File: src/components/ImporterModal.jsx
import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { firestore } from "../firebase.js"; // Make sure firestore is exported
import PropTypes from "prop-types";

export default function ImporterModal({ onClose, mergedData, incrementWrites }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ written: 0, skipped: 0, outOfTime: 0 });

  // Split writes into batches to reduce firestore writes at once
  const BATCH_SIZE = 500;

  const processImport = async () => {
    if (!mergedData || mergedData.length === 0) {
      alert("No data to import.");
      return;
    }

    setLoading(true);
    let written = 0;
    let skipped = 0;
    let outOfTime = 0;

    try {
      for (let i = 0; i < mergedData.length; i += BATCH_SIZE) {
        const batch = writeBatch(firestore);
        const chunk = mergedData.slice(i, i + BATCH_SIZE);

        chunk.forEach((item) => {
          // Check vigencia (date) again to be safe
          const vigenciaDate = new Date(item.vigencia);
          const now = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);

          if (vigenciaDate < oneYearAgo) {
            outOfTime++;
            return;
          }

          // Write each product once with barcodes array
          const docRef = doc(collection(firestore, "products"), item.productId);
          batch.set(docRef, {
            description: item.description,
            barcodes: item.barcodes,
            price: item.price,
            vigencia: item.vigencia,
          });
          written++;
        });

        await batch.commit();
        incrementWrites(written);
      }

      setStats({ written, skipped, outOfTime });
      alert(`Import complete. ${written} written, ${skipped} skipped, ${outOfTime} out of timeframe.`);
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      alert("Error writing to Firestore. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-3">Importar Productos a Firebase</h2>

        <div className="text-sm mb-2">
          <p>✅ A escribir: {stats.written}</p>
          <p>⚠️ Ignorados: {stats.skipped}</p>
          <p>⏰ Fuera de vigencia: {stats.outOfTime}</p>
        </div>

        <button
          onClick={processImport}
          disabled={loading}
          className="bg-gold text-black py-2 rounded mb-4 font-semibold"
        >
          {loading ? "Importando..." : "Importar a Firebase"}
        </button>

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
  mergedData: PropTypes.array.isRequired,
  incrementWrites: PropTypes.func.isRequired,
};
