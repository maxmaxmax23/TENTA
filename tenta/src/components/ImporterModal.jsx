// File: src/components/ImporterModal.jsx
import React, { useState, useEffect } from "react";
import { collection, doc, writeBatch, setDoc } from "firebase/firestore";
import PropTypes from "prop-types";
import { db } from "../firebase.js"; // Ensure db is exported from firebase.js

export default function ImporterModal({ onClose, queuedData, incrementWrites }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ written: 0, total: 0 });

  useEffect(() => {
    if (queuedData?.length) {
      setProgress({ written: 0, total: queuedData.length });
    }
  }, [queuedData]);

  const BATCH_SIZE = 50; // throttled batch size

  const processQueue = async () => {
    if (!queuedData || queuedData.length === 0) return;
    setProcessing(true);

    let writtenCount = 0;
    try {
      for (let i = 0; i < queuedData.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = queuedData.slice(i, i + BATCH_SIZE);

        chunk.forEach((product) => {
          const docRef = doc(collection(db, "products"), product.productId);
          batch.set(docRef, {
            description: product.description,
            barcodes: product.barcodes,
            price: product.price,
            vigencia: product.vigencia,
          }, { merge: true });
        });

        await batch.commit();
        writtenCount += chunk.length;
        setProgress({ written: writtenCount, total: queuedData.length });
        incrementWrites?.(chunk.length);
      }

      alert("Importación finalizada correctamente.");
    } catch (error) {
      console.error("Error importando productos:", error);
      alert("Error durante la importación. Ver consola.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-3">Importar Productos a Firebase</h2>

        <div className="mb-4">
          <p>Total en cola: {queuedData?.length || 0}</p>
          <p>Procesados: {progress.written} / {progress.total}</p>
        </div>

        <button
          onClick={processQueue}
          disabled={processing || !queuedData?.length}
          className="bg-gold text-black py-2 rounded mb-4 font-semibold"
        >
          {processing ? "Importando..." : "Importar Cola"}
        </button>

        <button
          onClick={onClose}
          className="mt-2 bg-gray-700 text-gold py-2 rounded hover:bg-gray-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

ImporterModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  queuedData: PropTypes.array,
  incrementWrites: PropTypes.func,
};
