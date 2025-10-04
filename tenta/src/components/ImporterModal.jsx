import React, { useState } from "react";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { firestore } from "../firebase.js";
import ExcelMerger from "./ExcelMerger";

export default function ImporterModal({ onClose }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState(null);

  const handleMerge = async (mergedProducts) => {
    setProducts(mergedProducts);
  };

  const handleImport = async () => {
    try {
      setStatus("Importing...");
      const batch = writeBatch(firestore);

      for (const product of products) {
        const docRef = doc(collection(firestore, "products"), product.id);
        const existingDoc = await getDoc(docRef);

        if (!existingDoc.exists()) {
          batch.set(docRef, product);
        } else {
          batch.update(docRef, product);
        }
      }

      await batch.commit();
      setStatus("Import complete!");
    } catch (err) {
      console.error("Error importing:", err);
      setStatus("Error during import");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">Import Products</h2>
        <ExcelMerger onMerge={handleMerge} />
        {status && <p className="mt-2">{status}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={handleImport}
          >
            Import
          </button>
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
