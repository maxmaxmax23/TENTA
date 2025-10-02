// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";

export default function ImporterModal({ onClose, incrementWrites }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [logMessages, setLogMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const appendLog = (msg) => setLogMessages((prev) => [...prev, msg]);

  const handleFileChange = (e, type) => {
    if (type === "equivalencias") setEquivalenciasFile(e.target.files[0]);
    if (type === "precios") setPreciosFile(e.target.files[0]);
  };

  const readXLSX = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  const handleImport = async () => {
    if (!equivalenciasFile || !preciosFile) {
      appendLog("❌ Debe seleccionar ambos archivos");
      return;
    }

    setLoading(true);
    setLogMessages([]);
    setProgress(0);

    try {
      appendLog("📖 Leyendo archivos...");
      const eqData = await readXLSX(equivalenciasFile);
      const prData = await readXLSX(preciosFile);

      // Build mapping: barcode -> productId
      const eqMap = {};
      eqData.slice(1).forEach((row, idx) => {
        const [barcode, productId] = row;
        if (barcode && productId) eqMap[barcode] = productId;
        else appendLog(`⚠ Fila ignorada en equivalencias: ${idx + 2}`);
      });

      // Build final products
      const productsToWrite = [];
      prData.slice(1).forEach((row, idx) => {
        const [productId, , , , vigencia, precio] = row;
        const barcode = Object.keys(eqMap).find((b) => eqMap[b] === productId);
        if (!barcode) {
          appendLog(`⚠ Sin equivalencia para ProductId ${productId}`);
          return;
        }
        if (!vigencia || !precio) {
          appendLog(`⚠ Vigencia o precio inválido para ProductId ${productId}`);
          return;
        }

        // Date filtering: only last year
        const [dd, mm, yyyy] = vigencia.split("/").map(Number);
        const vigDate = new Date(yyyy + 2000, mm - 1, dd); // assumes YY format
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (vigDate < oneYearAgo) return;

        productsToWrite.push({
          id: productId,
          barcode,
          vigencia,
          precio,
        });
      });

      appendLog(`📝 Productos a escribir: ${productsToWrite.length}`);

      // Batch write with throttle
      const batchSize = 50;
      for (let i = 0; i < productsToWrite.length; i += batchSize) {
        const batch = productsToWrite.slice(i, i + batchSize);
        await Promise.all(
          batch.map((p) =>
            setDoc(doc(db, "products", p.barcode), p).catch((err) => {
              appendLog(`❌ Error en ${p.barcode}: ${err.message}`);
            })
          )
        );
        setProgress(((i + batch.length) / productsToWrite.length) * 100);
        incrementWrites(batch.length);
      }

      appendLog("✅ Importación completada!");
    } catch (err) {
      console.error(err);
      appendLog(`❌ Error al procesar los archivos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-lg bg-gray-900 p-6 rounded-xl shadow-lg text-gold space-y-4">
        <h2 className="text-xl font-bold">Importar Productos</h2>

        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => handleFileChange(e, "equivalencias")}
          className="w-full text-sm"
        />
        <label className="text-sm">Archivo Equivalencias</label>

        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => handleFileChange(e, "precios")}
          className="w-full text-sm"
        />
        <label className="text-sm">Archivo Precios</label>

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
        >
          {loading ? "Importando..." : "Importar"}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Cancelar
        </button>

        <div className="w-full bg-gray-800 h-3 rounded overflow-hidden">
          <div
            className="bg-gold h-3"
            style={{ width: `${progress}%`, transition: "width 0.2s" }}
          ></div>
        </div>

        <div className="h-48 overflow-y-auto bg-gray-800 p-2 rounded">
          {logMessages.map((msg, idx) => (
            <p key={idx} className="text-sm">
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
