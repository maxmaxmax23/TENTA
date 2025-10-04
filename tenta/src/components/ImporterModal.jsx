// File: src/components/ImporterModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
// Make sure to import Firestore correctly
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import PropTypes from "prop-types";

export default function ImporterModal({ onClose, queuedData, firestore }) {
  const [importData, setImportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ written: 0, skipped: 0, outOfTime: 0 });

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  const loadFile = async (file) => {
    try {
      const rows = await parseExcel(file);
      const data = rows.slice(1).map((r) => ({
        productId: r[0]?.toString().trim(),
        description: r[1]?.toString().trim(),
        barcodes: r[2] ? r[2].toString().split(",").map((b) => b.trim()) : [],
        price: parseInt(r[3], 10),
        vigencia: r[4]?.toString().trim(),
        status: r[5] || "merged",
      }));
      setImportData(data);
    } catch (err) {
      console.error("Error parsing Excel:", err);
      alert("Error al leer el archivo. Ver consola.");
    }
  };

  const loadQueue = () => {
    if (!queuedData || !queuedData.length) return alert("No hay productos en la cola");
    setImportData([...queuedData]);
  };

  const handleImport = async () => {
    if (!importData.length) return alert("No hay datos para importar");
    setLoading(true);

    try {
      const batch = writeBatch(firestore);
      let written = 0, skipped = 0;

      importData.forEach((item) => {
        if (!item.productId) {
          skipped++;
          return;
        }
        const docRef = doc(collection(firestore, "products"), item.productId);
        batch.set(docRef, { 
          description: item.description,
          barcodes: item.barcodes,
          price: item.price,
          vigencia: item.vigencia,
        }, { merge: true });
        written++;
      });

      await batch.commit();
      setStats({ written, skipped, outOfTime: 0 });
      alert(`Import completed: ${written} written, ${skipped} skipped`);
      setImportData([]);
    } catch (err) {
      console.error("Error importing data:", err);
      alert("Error al importar datos. Ver consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-3">Importar Productos</h2>

        <div className="flex flex-col gap-2 mb-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => loadFile(e.target.files[0])}
            className="text-sm text-white"
          />
          <label className="text-xs text-gray-400">Cargar desde archivo</label>

          <button
            onClick={loadQueue}
            className="bg-green-600 text-black py-2 rounded font-semibold"
          >
            Cargar desde la cola
          </button>
        </div>

        <div className="overflow-y-auto max-h-64 border border-gold rounded mb-2">
          <table className="w-full text-xs text-left">
            <thead className="bg-gold text-black sticky top-0">
              <tr>
                <th className="p-1">ID</th>
                <th className="p-1">Descripción</th>
                <th className="p-1">Códigos</th>
                <th className="p-1">Precio</th>
                <th className="p-1">Vigencia</th>
              </tr>
            </thead>
            <tbody>
              {importData.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="p-1">{item.productId}</td>
                  <td className="p-1">{item.description}</td>
                  <td className="p-1">{item.barcodes.join(", ")}</td>
                  <td className="p-1">{item.price}</td>
                  <td className="p-1">{item.vigencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleImport}
            disabled={loading || !importData.length}
            className="bg-gold text-black py-2 px-4 rounded font-semibold"
          >
            {loading ? "Importando..." : "Importar a Firestore"}
          </button>

          <button
            onClick={onClose}
            className="bg-gray-700 text-gold py-2 px-4 rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

ImporterModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  queuedData: PropTypes.array,
  firestore: PropTypes.object.isRequired,
};
