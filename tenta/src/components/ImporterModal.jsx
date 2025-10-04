import React, { useState } from "react";
import * as XLSX from "xlsx";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import ExcelMerger from "./ExcelMerger.jsx";

export default function ImporterModal({ onClose, incrementWrites }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [mergedData, setMergedData] = useState(null);

  const handleFileUpload = (data) => {
    setMergedData(data);
  };

  const handleImport = async () => {
    if (!mergedData) {
      setStatus("No hay datos cargados.");
      return;
    }

    setLoading(true);
    setStatus("Procesando...");
    let batch = writeBatch(db);
    let writeCount = 0;
    let batchCount = 0;

    try {
      for (const row of mergedData) {
        const productId = row["product_id"];
        if (!productId) continue;

        const ref = doc(collection(db, "products"), productId);
        const snapshot = await getDoc(ref);

        let productData = {};
        if (snapshot.exists()) {
          const existing = snapshot.data();
          const barcodes = new Set(existing.barcodes || []);
          if (row["barcode"]) barcodes.add(row["barcode"]);

          productData = {
            ...existing,
            barcodes: Array.from(barcodes),
            description: row["description"] || existing.description,
            price: row["price"] || existing.price,
            lastUpdated: new Date().toISOString(),
          };
        } else {
          productData = {
            product_id: productId,
            barcodes: row["barcode"] ? [row["barcode"]] : [],
            description: row["description"] || "",
            price: row["price"] || 0,
            lastUpdated: new Date().toISOString(),
          };
        }

        batch.set(ref, productData);
        writeCount++;

        if (writeCount % 400 === 0) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount++;
        }
      }

      await batch.commit();
      incrementWrites(writeCount);
      setStatus(`Importación completa (${writeCount} registros, ${batchCount + 1} lotes).`);
    } catch (error) {
      console.error("Error al importar:", error);
      setStatus("Error durante la importación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center p-4">
      <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg w-[90%] max-w-2xl animate-fadeIn">
        <h2 className="text-2xl mb-4 text-gold">Importar Excel</h2>

        <ExcelMerger onMergeComplete={handleFileUpload} />

        <div className="mt-4 flex justify-between">
          <button
            onClick={handleImport}
            disabled={loading}
            className="bg-gold text-black px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Importando..." : "Importar datos"}
          </button>
          <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded">
            Cerrar
          </button>
        </div>

        {status && <p className="mt-4 text-sm text-gray-300">{status}</p>}
      </div>
    </div>
  );
}
