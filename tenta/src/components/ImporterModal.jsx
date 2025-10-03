import React, { useState } from "react";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { firestore } from "../firebase.js";
import ExcelMerger from "./ExcelMerger";

export default function ImporterModal({ onClose }) {
  const [mergedData, setMergedData] = useState(null);
  const [stats, setStats] = useState(null);
  const [log, setLog] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Stats: writes, skipped, out of timeframe
  const analyzeData = async (data) => {
    let writes = 0;
    let skipped = 0;
    let outOfTime = 0;

    for (let product of data) {
      // If no vigencia or expired → out of timeframe
      if (!product.vigencia || new Date(product.vigencia) < new Date()) {
        outOfTime++;
        continue;
      }

      // Check Firebase to see if needs writing
      const ref = doc(collection(firestore, "products"), product.productId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        writes++;
      } else {
        const existing = snap.data();
        const changed =
          existing.price !== product.price ||
          existing.description !== product.description ||
          JSON.stringify(existing.barcodes || []) !==
            JSON.stringify(product.barcodes || []);

        if (changed) writes++;
        else skipped++;
      }
    }

    setStats({ writes, skipped, outOfTime });
  };

  // Write data to Firebase
  const writeData = async () => {
    if (!mergedData) return;
    setProcessing(true);
    setLog(["Escribiendo en Firebase..."]);

    try {
      const batch = writeBatch(firestore);
      let count = 0;

      for (let product of mergedData) {
        if (!product.vigencia || new Date(product.vigencia) < new Date()) {
          continue;
        }

        const ref = doc(collection(firestore, "products"), product.productId);
        const snap = await getDoc(ref);

        if (!snap.exists() || snap.data().price !== product.price) {
          batch.set(ref, product, { merge: true });
          count++;
        }

        if (count >= 400) {
          await batch.commit();
          setLog((prev) => [...prev, `✅ ${count} productos escritos`]);
          count = 0;
        }
      }

      if (count > 0) await batch.commit();

      setLog((prev) => [...prev, "🎉 Importación completada"]);
    } catch (err) {
      console.error(err);
      setLog((prev) => [...prev, `❌ Error: ${err.message}`]);
    }

    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Importador</h2>

        {!mergedData && (
          <ExcelMerger
            onMerge={(data) => {
              setMergedData(data);
              analyzeData(data);
            }}
          />
        )}

        {stats && (
          <div className="mt-4 p-3 bg-gray-800 rounded">
            <h3 className="font-bold mb-2">Resumen</h3>
            <p>🟢 Para escribir: {stats.writes}</p>
            <p>⚪ Skipped (sin cambios): {stats.skipped}</p>
            <p>🔴 Fuera de vigencia: {stats.outOfTime}</p>
          </div>
        )}

        {mergedData && (
          <div className="mt-4 overflow-x-auto max-h-64 overflow-y-auto text-sm">
            <table className="w-full border border-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2">ProductoID</th>
                  <th className="p-2">Descripción</th>
                  <th className="p-2">Barcodes</th>
                  <th className="p-2">Precio</th>
                  <th className="p-2">Vigencia</th>
                </tr>
              </thead>
              <tbody>
                {mergedData.slice(0, 20).map((p, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="p-2">{p.productId}</td>
                    <td className="p-2">{p.description}</td>
                    <td className="p-2">{p.barcodes?.join(", ")}</td>
                    <td className="p-2">{p.price}</td>
                    <td className="p-2">{p.vigencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-2 text-gray-400">
              Mostrando 20 primeros productos
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
            onClick={onClose}
          >
            Cerrar
          </button>

          {mergedData && (
            <button
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={writeData}
              disabled={processing}
            >
              {processing ? "Procesando..." : "Escribir en Firebase"}
            </button>
          )}
        </div>

        <div className="mt-4 text-sm whitespace-pre-wrap bg-black/40 p-2 rounded">
          {log.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
