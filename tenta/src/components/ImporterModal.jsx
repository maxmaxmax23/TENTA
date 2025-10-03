// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

export default function ImporterModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [mergedProducts, setMergedProducts] = useState([]);
  const [counters, setCounters] = useState({ toWrite: 0, skipped: 0, untouched: 0 });
  const [loading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState([]);

  const handleFiles = (e) => setFiles(e.target.files);

  const parseXLSX = (file, sheetIndex = 0) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[sheetIndex]];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const normalizeDate = (str) => {
    if (!str) return null;
    const parts = str.toString().split(/[\/\-]/);
    if (parts.length !== 3) return null;
    let [d, m, y] = parts;
    if (y.length === 2) y = "20" + y;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  };

  const normalizePrice = (str) => {
    if (!str) return null;
    return parseFloat(str.toString().replace(",", ".").replace(/[^\d.]/g, "")) || null;
  };

  const mergeFiles = async () => {
    if (files.length < 2) {
      alert("Selecciona los dos archivos en orden: Equivalencias, Precios");
      return;
    }
    setLoading(true);
    const [equivFile, preciosFile] = files;
    try {
      const equivData = await parseXLSX(equivFile);
      const preciosData = await parseXLSX(preciosFile);

      // Remove headers
      equivData.shift();
      preciosData.shift();

      // Build productId -> barcodes map
      const barcodeMap = {};
      equivData.forEach((row) => {
        const [barcode, productId] = row;
        if (!barcode || !productId) return;
        if (!barcodeMap[productId]) barcodeMap[productId] = [];
        barcodeMap[productId].push(barcode.toString());
      });

      const merged = [];
      const skipped = [];
      const untouched = [];

      for (const row of preciosData) {
        const [productId, desc, , , vigenciaStr, priceStr] = row;
        const normalizedDate = normalizeDate(vigenciaStr);
        const normalizedPrice = normalizePrice(priceStr);

        if (!productId || !normalizedDate || !normalizedPrice) {
          skipped.push({ productId, reason: "Datos inválidos o vigencia/price vacía" });
          continue;
        }

        const barcodes = barcodeMap[productId] || [];

        // Check if already in DB
        const docRef = doc(db, "products", productId);
        const snapshot = await getDoc(docRef);
        const existing = snapshot.exists() ? snapshot.data() : null;

        // Only write if changed
        const toWrite = !existing ||
          existing.descripcion !== desc ||
          existing.vigencia !== normalizedDate ||
          existing.precio !== normalizedPrice ||
          JSON.stringify(existing.barcodes || []) !== JSON.stringify(barcodes);

        if (toWrite) {
          merged.push({
            productId,
            descripcion: desc,
            vigencia: normalizedDate,
            precio: normalizedPrice,
            barcodes,
            status: "To Write",
          });
        } else {
          untouched.push({
            productId,
            descripcion: desc,
            vigencia: normalizedDate,
            precio: normalizedPrice,
            barcodes,
            status: "Untouched",
          });
        }
      }

      setMergedProducts([...merged, ...untouched]);
      setCounters({ toWrite: merged.length, skipped: skipped.length, untouched: untouched.length });
      setErrorLog(skipped);

    } catch (err) {
      console.error(err);
      alert("Error al procesar los archivos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processWrite = async () => {
    if (mergedProducts.length === 0) return;

    setLoading(true);
    try {
      // Backup previous import
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupRef = ref(storage, `backups/import_${timestamp}.json`);
      await uploadBytes(backupRef, new Blob([JSON.stringify(mergedProducts, null, 2)], { type: "application/json" }));

      // Write to Firestore in batches
      for (const product of mergedProducts) {
        if (product.status !== "To Write") continue;
        const docRef = doc(db, "products", product.productId);
        await setDoc(docRef, {
          descripcion: product.descripcion,
          vigencia: product.vigencia,
          precio: product.precio,
          barcodes: product.barcodes,
        });
      }

      alert(`Importación completa. ${counters.toWrite} productos escritos.`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al escribir en Firestore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 overflow-auto">
      <div className="w-11/12 max-w-3xl bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Importar Productos</h2>
        <input type="file" multiple accept=".xls,.xlsx" onChange={handleFiles} className="mb-4" />
        <div className="flex space-x-2 mb-4">
          <button
            onClick={mergeFiles}
            disabled={loading}
            className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Previsualizar"}
          </button>
          <button
            onClick={processWrite}
            disabled={loading || counters.toWrite === 0}
            className="px-4 py-2 bg-green-600 text-black rounded-lg hover:bg-green-500 transition disabled:opacity-50"
          >
            Escribir en Firestore
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>

        <div className="mb-4">
          <p>Productos a escribir: {counters.toWrite}</p>
          <p>Productos ignorados: {counters.skipped}</p>
          <p>Productos sin cambios: {counters.untouched}</p>
        </div>

        {errorLog.length > 0 && (
          <div className="mb-4 max-h-40 overflow-auto bg-gray-800 p-2 rounded">
            <p className="font-bold">Errores:</p>
            {errorLog.map((err, idx) => (
              <p key={idx}>{err.productId || "N/A"} - {err.reason}</p>
            ))}
          </div>
        )}

        {mergedProducts.length > 0 && (
          <div className="overflow-auto max-h-64 bg-gray-800 p-2 rounded">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr>
                  <th>Producto ID</th>
                  <th>Descripción</th>
                  <th>Vigencia</th>
                  <th>Precio</th>
                  <th>Codigos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {mergedProducts.map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.productId}</td>
                    <td>{p.descripcion}</td>
                    <td>{p.vigencia}</td>
                    <td>{p.precio}</td>
                    <td>{p.barcodes.join(", ")}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
