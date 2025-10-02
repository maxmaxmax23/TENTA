// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ImporterModal({ onClose }) {
  const [fileEqui, setFileEqui] = useState(null);
  const [filePrecios, setFilePrecios] = useState(null);
  const [toWrite, setToWrite] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState([]);
  const [writeCounter, setWriteCounter] = useState(0);

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  const mergeFiles = (equivRows, preciosRows) => {
    const merged = [];
    const skippedRows = [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Start from row 1 to skip headers
    const eqMap = {};
    for (let i = 1; i < equivRows.length; i++) {
      const row = equivRows[i];
      const barcode = row[0];
      const productId = row[1];
      eqMap[productId] = barcode;
    }

    for (let i = 1; i < preciosRows.length; i++) {
      const row = preciosRows[i];
      const productId = row[0];
      const description = row[1];
      const listName = row[3]; // optional
      const vigenciaStr = row[4]; // DD/MM/YYYY
      const price = row[5];

      if (!productId || !vigenciaStr) {
        skippedRows.push({ productId, reason: "Fila ignorada: datos faltantes" });
        continue;
      }

      const parts = vigenciaStr.split("/");
      const vigDate = new Date(
        parseInt(parts[2], 10) + 2000, // assume YY to YYYY
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10)
      );

      if (vigDate < oneYearAgo) {
        skippedRows.push({ productId, reason: "Vigencia fuera de rango" });
        continue;
      }

      const barcode = eqMap[productId];
      if (!barcode) {
        skippedRows.push({ productId, reason: "No se encuentra barcode" });
        continue;
      }

      merged.push({ productId, barcode, description, listName, vigencia: vigenciaStr, price });
    }

    return { merged, skippedRows };
  };

  const handlePreview = async () => {
    if (!fileEqui || !filePrecios) {
      alert("Seleccione ambos archivos");
      return;
    }
    setProcessing(true);
    setLog([]);
    try {
      const [equivRows, preciosRows] = await Promise.all([
        parseExcel(fileEqui),
        parseExcel(filePrecios),
      ]);

      const { merged, skippedRows } = mergeFiles(equivRows, preciosRows);

      setToWrite(merged);
      setSkipped(skippedRows);
    } catch (err) {
      console.error(err);
      alert("Error al procesar los archivos");
    } finally {
      setProcessing(false);
    }
  };

  const handleWrite = async () => {
    if (!toWrite.length) {
      alert("No hay productos para escribir");
      return;
    }
    setProcessing(true);
    let counter = 0;

    // Backup current live DB
    const backupRef = ref(storage, `backups/products_live.json`);
    const liveData = {};
    for (const item of toWrite) {
      const docSnap = await getDoc(doc(db, "products", item.productId));
      if (docSnap.exists()) liveData[item.productId] = docSnap.data();
    }
    const blob = new Blob([JSON.stringify(liveData, null, 2)], { type: "application/json" });
    await uploadBytes(backupRef, blob);

    for (const item of toWrite) {
      const docRef = doc(db, "products", item.productId);
      const docSnap = await getDoc(docRef);
      let shouldWrite = true;
      if (docSnap.exists()) {
        const existing = docSnap.data();
        if (
          existing.price === item.price &&
          existing.description === item.description &&
          existing.barcode === item.barcode
        ) {
          shouldWrite = false;
          setSkipped((prev) => [...prev, { productId: item.productId, reason: "Sin cambios" }]);
        }
      }
      if (shouldWrite) {
        await setDoc(docRef, item);
        counter++;
        setWriteCounter(counter);
      }
    }
    alert(`Importación completa: ${counter} productos escritos`);
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-3xl bg-gray-900 text-gold rounded-xl p-6 space-y-4 shadow-lg">
        <h2 className="text-2xl font-bold text-center">Importar Productos</h2>

        <div className="flex space-x-2">
          <input type="file" accept=".xls,.xlsx" onChange={(e) => setFileEqui(e.target.files[0])} />
          <input type="file" accept=".xls,.xlsx" onChange={(e) => setFilePrecios(e.target.files[0])} />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handlePreview}
            disabled={processing}
            className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {processing ? "Procesando..." : "Procesar y Previsualizar"}
          </button>
          <button
            onClick={handleWrite}
            disabled={processing || !toWrite.length}
            className="flex-1 py-2 bg-green-600 text-black rounded-lg hover:bg-green-500 transition disabled:opacity-50"
          >
            {processing ? "Importando..." : `Escribir en Firebase (${writeCounter})`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>

        {toWrite.length > 0 && (
          <div className="max-h-64 overflow-auto bg-gray-800 p-2 rounded">
            <h3 className="font-semibold mb-2">Productos a Escribir ({toWrite.length})</h3>
            <ul className="text-sm">
              {toWrite.map((p) => (
                <li key={p.productId}>
                  {p.productId} - {p.description} - ${p.price}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skipped.length > 0 && (
          <div className="max-h-64 overflow-auto bg-gray-800 p-2 rounded">
            <h3 className="font-semibold mb-2">Productos Ignorados ({skipped.length})</h3>
            <ul className="text-sm">
              {skipped.map((p, i) => (
                <li key={i}>
                  {p.productId || "Sin ID"} - {p.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gray-700 p-2 rounded max-h-32 overflow-auto">
          <h3 className="font-semibold">Log</h3>
          <ul className="text-xs">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
