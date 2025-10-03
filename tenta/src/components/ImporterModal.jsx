// src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";

export default function ImporterModal({ onClose }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [mergedData, setMergedData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("");
  const [importing, setImporting] = useState(false);

  // --- Helpers ---
  const parseExcel = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(sheet, { header: 1 }));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsBinaryString(file);
    });

  const normalizeBarcode = (val) => {
    if (!val) return null;
    return String(val).replace(/\s/g, "");
  };

  const normalizeProductId = (val) => {
    if (!val) return null;
    return String(val).trim();
  };

  const normalizeDate = (val) => {
    if (!val) return null;
    // Excel date serial
    if (typeof val === "number") {
      return XLSX.SSF.format("dd/mm/yyyy", val);
    }
    return String(val).trim();
  };

  const isWithinLastYear = (dateStr) => {
    if (!dateStr) return false;
    const [d, m, y] = dateStr.split(/[/-]/);
    const parsed = new Date(`20${y.length === 2 ? y : y}-${m}-${d}`);
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return parsed >= oneYearAgo && parsed <= now;
  };

  // --- Main processing ---
  const handleProcessFiles = async () => {
    if (!equivalenciasFile || !preciosFile) {
      setStatus("❌ Debes seleccionar ambos archivos.");
      return;
    }

    setStatus("⏳ Procesando archivos...");

    try {
      const [eqRows, prRows] = await Promise.all([
        parseExcel(equivalenciasFile),
        parseExcel(preciosFile),
      ]);

      const eqData = eqRows.slice(1).map((row) => ({
        barcode: normalizeBarcode(row[0]),
        productId: normalizeProductId(row[1]),
        description: row[2] || "",
      }));

      const prData = prRows.slice(1).map((row) => ({
        productId: normalizeProductId(row[0]),
        description: row[1] || "",
        list: row[2],
        label: row[3],
        vigencia: normalizeDate(row[4]),
        price: parseFloat(row[5]) || 0,
      }));

      const mapEq = {};
      eqData.forEach((e) => {
        if (!e.productId) return;
        if (!mapEq[e.productId]) mapEq[e.productId] = [];
        if (e.barcode) mapEq[e.productId].push(e.barcode);
      });

      const merged = prData.map((p) => ({
        productId: p.productId,
        description: p.description,
        price: p.price,
        vigencia: p.vigencia,
        barcodes: mapEq[p.productId] || [],
      }));

      // Classification
      const toWrite = [];
      const untouched = [];
      const outOfTime = [];
      const errors = [];

      for (let m of merged) {
        if (!m.productId) {
          errors.push(m);
          continue;
        }

        if (!m.vigencia || !isWithinLastYear(m.vigencia)) {
          outOfTime.push(m);
          continue;
        }

        // Check existing in Firestore
        const docRef = doc(db, "products", m.productId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const existing = snap.data();
          const isSame =
            existing.price === m.price &&
            existing.description === m.description &&
            existing.vigencia === m.vigencia &&
            JSON.stringify(existing.barcodes || []) ===
              JSON.stringify(m.barcodes || []);
          if (isSame) {
            untouched.push(m);
          } else {
            toWrite.push(m);
          }
        } else {
          toWrite.push(m);
        }
      }

      setMergedData([...toWrite, ...untouched, ...outOfTime, ...errors]);
      setSummary({
        toWrite: toWrite.length,
        untouched: untouched.length,
        outOfTime: outOfTime.length,
        errors: errors.length,
      });
      setStatus("✅ Procesamiento completado. Revisa la vista previa.");
    } catch (err) {
      console.error("Error:", err);
      setStatus("❌ Error al procesar los archivos.");
    }
  };

  const handleConfirmImport = async () => {
    if (!summary?.toWrite) {
      alert("No hay productos para importar.");
      return;
    }

    setImporting(true);
    setStatus("⏳ Importando datos a Firestore...");

    try {
      const batch = writeBatch(db);
      let counter = 0;

      for (let m of mergedData) {
        if (!m.productId || !m.vigencia) continue;
        const docRef = doc(db, "products", m.productId);
        batch.set(docRef, m, { merge: true });
        counter++;

        if (counter % 400 === 0) {
          await batch.commit();
        }
      }

      if (counter % 400 !== 0) {
        await batch.commit();
      }

      setStatus(`✅ Importación completada. ${summary.toWrite} productos escritos.`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error al importar en Firestore.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Importar productos</h2>

        <div className="space-y-2">
          <input type="file" accept=".xlsx" onChange={(e) => setEquivalenciasFile(e.target.files[0])} />
          <input type="file" accept=".xlsx" onChange={(e) => setPreciosFile(e.target.files[0])} />
        </div>

        <button
          onClick={handleProcessFiles}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Procesar y Previsualizar
        </button>

        {status && <p className="mt-2">{status}</p>}

        {summary && (
          <div className="mt-4">
            <p>🟢 Para escribir: {summary.toWrite}</p>
            <p>⚪ Sin cambios: {summary.untouched}</p>
            <p>🔴 Fuera de vigencia: {summary.outOfTime}</p>
            <p>⚠️ Errores: {summary.errors}</p>
          </div>
        )}

        {mergedData.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Producto ID</th>
                  <th className="p-2 border">Códigos</th>
                  <th className="p-2 border">Descripción</th>
                  <th className="p-2 border">Precio</th>
                  <th className="p-2 border">Vigencia</th>
                </tr>
              </thead>
              <tbody>
                {mergedData.slice(0, 100).map((m, i) => {
                  let estado = "⚠️ Error";
                  if (isWithinLastYear(m.vigencia)) {
                    estado = "🟢 Escribir";
                  } else if (!m.vigencia) {
                    estado = "⚠️ Sin fecha";
                  }
                  return (
                    <tr key={i} className="border">
                      <td className="p-1 border">{estado}</td>
                      <td className="p-1 border">{m.productId}</td>
                      <td className="p-1 border">{m.barcodes?.join(", ")}</td>
                      <td className="p-1 border">{m.description}</td>
                      <td className="p-1 border">{m.price}</td>
                      <td className="p-1 border">{m.vigencia}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-sm mt-2">Mostrando primeras 100 filas...</p>
          </div>
        )}

        {summary?.toWrite > 0 && (
          <button
            onClick={handleConfirmImport}
            disabled={importing}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            {importing ? "Importando..." : "Confirmar Importación"}
          </button>
        )}

        <button onClick={onClose} className="mt-2 bg-gray-500 text-white px-4 py-2 rounded">
          Cerrar
        </button>
      </div>
    </div>
  );
}
