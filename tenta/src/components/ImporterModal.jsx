// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ImporterModal({ onClose }) {
  const [equivFile, setEquivFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [mergedData, setMergedData] = useState([]);
  const [toWriteCount, setToWriteCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState([]);

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  };

  const mergeFiles = async () => {
    if (!equivFile || !preciosFile) {
      alert("Por favor seleccione ambos archivos.");
      return;
    }

    setProcessing(true);
    setLog([]);
    try {
      const equivRows = await parseExcel(equivFile);
      const preciosRows = await parseExcel(preciosFile);

      // Skip headers
      const equivData = equivRows.slice(1);
      const preciosData = preciosRows.slice(1);

      const merged = [];
      const skipped = [];

      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      // Build lookup map for precios by productId
      const preciosMap = {};
      preciosData.forEach((row) => {
        const productId = row[0];
        const vigenciaRaw = row[4];
        const vigenciaParts = vigenciaRaw.split("/"); // DD/MM/YYYY
        const vigencia = new Date(
          +vigenciaParts[2],
          +vigenciaParts[1] - 1,
          +vigenciaParts[0]
        );
        if (vigencia < oneYearAgo) {
          skipped.push(`Fila ignorada Vigencia antigua para Articulo ${productId}`);
          return;
        }
        preciosMap[productId] = {
          productId,
          description: row[1],
          listName: row[3],
          vigencia: vigenciaRaw,
          price: row[5],
        };
      });

      // Merge Equivalencias with Precios
      equivData.forEach((row) => {
        const barcode = row[0];
        const productId = row[1];
        const description = row[2];

        const precioData = preciosMap[productId];
        if (!precioData) {
          skipped.push(`Fila ignorada: No hay precio para Articulo ${productId}`);
          return;
        }

        merged.push({
          barcode,
          productId,
          description: description || precioData.description,
          listName: precioData.listName,
          vigencia: precioData.vigencia,
          price: precioData.price,
        });
      });

      setMergedData(merged);
      setToWriteCount(merged.length);
      setSkippedCount(skipped.length);
      setLog(skipped);
    } catch (err) {
      console.error(err);
      alert("Error al procesar los archivos");
    } finally {
      setProcessing(false);
    }
  };

  const writeToFirestore = async () => {
    if (mergedData.length === 0) {
      alert("No hay datos para importar");
      return;
    }

    setProcessing(true);
    const batchLog = [];
    let writes = 0;

    for (const product of mergedData) {
      const docRef = doc(db, "products", product.productId);
      const docSnap = await getDoc(docRef);

      let shouldWrite = false;
      if (!docSnap.exists()) shouldWrite = true;
      else {
        const existing = docSnap.data();
        // Only write if any key data changed
        if (
          existing.price !== product.price ||
          existing.description !== product.description ||
          existing.barcode !== product.barcode
        )
          shouldWrite = true;
      }

      if (shouldWrite) {
        await setDoc(docRef, product, { merge: true });
        writes++;
        batchLog.push(`Producto escrito: ${product.productId}`);
      } else batchLog.push(`Producto ignorado: ${product.productId}`);
    }

    alert(`Importación finalizada. Productos escritos: ${writes}`);
    setLog(batchLog);
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 overflow-auto">
      <div className="w-11/12 max-w-2xl bg-gray-900 p-6 rounded-xl shadow-lg text-gold space-y-4">
        <h2 className="text-xl font-bold mb-2">Importar Productos</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => setEquivFile(e.target.files[0])}
          />
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => setPreciosFile(e.target.files[0])}
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={mergeFiles}
            disabled={processing}
            className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {processing ? "Procesando..." : "Procesar y Previsualizar"}
          </button>
          <button
            onClick={writeToFirestore}
            disabled={processing || mergedData.length === 0}
            className="flex-1 py-2 bg-green-600 text-black rounded-lg hover:bg-green-500 transition disabled:opacity-50"
          >
            Escribir a Firestore
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>

        {mergedData.length > 0 && (
          <div className="mt-4 max-h-64 overflow-auto">
            <p>Productos para escribir: {toWriteCount}</p>
            <p>Productos ignorados: {skippedCount}</p>
            <ul className="text-sm space-y-1">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
