// File: src/components/ImporterModal.jsx
import { useState } from "react";
import { db, storage } from "../firebase.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import * as XLSX from "xlsx";

export default function ImporterModal({ onClose, firebaseWritesCounter, setFirebaseWritesCounter }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [errorLog, setErrorLog] = useState([]);

  const handleProcess = async () => {
    if (!equivalenciasFile || !preciosFile) {
      alert("Por favor selecciona ambos archivos: Equivalencias y Precios.");
      return;
    }

    setProcessing(true);
    setPreview([]);
    setErrorLog([]);
    try {
      // Read Equivalencias
      const eqData = XLSX.read(await equivalenciasFile.arrayBuffer(), { type: "array" });
      const eqSheet = eqData.Sheets[eqData.SheetNames[0]];
      const eqRows = XLSX.utils.sheet_to_json(eqSheet, { header: 1, raw: false });
      // Skip header row
      const eqMap = {};
      eqRows.slice(1).forEach((row, i) => {
        const barcode = row[0]?.toString().trim();
        const productId = row[1]?.toString().trim();
        if (barcode && productId) {
          if (!eqMap[productId]) eqMap[productId] = [];
          eqMap[productId].push(barcode);
        } else {
          setErrorLog(prev => [...prev, `Equivalencias fila ${i + 2} ignorada`]);
        }
      });

      // Read Precios
      const prData = XLSX.read(await preciosFile.arrayBuffer(), { type: "array" });
      const prSheet = prData.Sheets[prData.SheetNames[0]];
      const prRows = XLSX.utils.sheet_to_json(prSheet, { header: 1, raw: false });

      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const mergedProducts = [];

      prRows.slice(1).forEach((row, i) => {
        const productId = row[0]?.toString().trim();
        const description = row[1]?.toString().trim();
        const vigenciaRaw = row[4]?.toString().trim();
        const priceRaw = row[5]?.toString().trim();

        if (!productId) {
          setErrorLog(prev => [...prev, `Precios fila ${i + 2} ignorada: sin productId`]);
          return;
        }

        // Normalize vigencia date (DD/MM/YY or DD/MM/YYYY)
        let vigenciaDate = null;
        if (vigenciaRaw) {
          const parts = vigenciaRaw.split(/[\/-]/);
          if (parts.length === 3) {
            let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            vigenciaDate = new Date(`${year}-${parts[1]}-${parts[0]}`);
          }
        }

        if (!vigenciaDate || vigenciaDate < oneYearAgo || vigenciaDate > today) {
          mergedProducts.push({ productId, description, status: "fuera de vigencia" });
          return;
        }

        // Normalize price
        let price = parseFloat(priceRaw?.replace(",", "."));
        if (isNaN(price)) price = 0;

        const barcodes = eqMap[productId] || [];

        mergedProducts.push({
          productId,
          description,
          price,
          barcodes,
          status: "pendiente"
        });
      });

      setPreview(mergedProducts);
    } catch (err) {
      console.error(err);
      setErrorLog(prev => [...prev, "Error al procesar los archivos"]);
    } finally {
      setProcessing(false);
    }
  };

  const handleWriteToFirestore = async () => {
    setProcessing(true);
    let writesCount = 0;

    for (const p of preview) {
      if (p.status !== "pendiente") continue;

      const docRef = doc(db, "products", p.productId);
      try {
        const snapshot = await getDoc(docRef);
        const currentData = snapshot.exists() ? snapshot.data() : {};
        // Only write if changed
        const needUpdate =
          !snapshot.exists() ||
          currentData.price !== p.price ||
          currentData.description !== p.description ||
          JSON.stringify(currentData.barcodes || []) !== JSON.stringify(p.barcodes);

        if (needUpdate) {
          await setDoc(docRef, {
            description: p.description,
            price: p.price,
            barcodes: p.barcodes
          }, { merge: true });

          writesCount++;
        }
      } catch (err) {
        setErrorLog(prev => [...prev, `Error escribiendo ${p.productId}: ${err.message}`]);
      }
    }

    setFirebaseWritesCounter(prev => prev + writesCount);
    alert(`Importación completada. Productos escritos: ${writesCount}`);
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-start p-4 overflow-y-auto">
      <h2 className="text-xl font-bold text-gold mb-4">Importar Productos</h2>

      <div className="w-full max-w-lg space-y-2">
        <label className="text-gold">Archivo Equivalencias</label>
        <input type="file" accept=".xls,.xlsx" onChange={e => setEquivalenciasFile(e.target.files[0])} />

        <label className="text-gold">Archivo Precios</label>
        <input type="file" accept=".xls,.xlsx" onChange={e => setPreciosFile(e.target.files[0])} />
      </div>

      <div className="flex space-x-2 mt-4">
        <button
          onClick={handleProcess}
          disabled={processing}
          className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
        >
          {processing ? "Procesando..." : "Previsualizar"}
        </button>
        <button
          onClick={handleWriteToFirestore}
          disabled={processing || preview.length === 0}
          className="px-4 py-2 bg-green-600 text-black rounded-lg hover:bg-green-500 transition"
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

      {preview.length > 0 && (
        <div className="mt-4 w-full max-w-lg bg-gray-900 text-gold p-2 rounded-lg overflow-auto">
          <h3 className="font-semibold mb-2">Previsualización</h3>
          <table className="w-full text-sm table-auto">
            <thead>
              <tr>
                <th>ProductId</th>
                <th>Status</th>
                <th>Barcodes</th>
                <th>Price</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p, idx) => (
                <tr key={idx} className={p.status === "pendiente" ? "bg-gray-800" : "bg-gray-700"}>
                  <td>{p.productId}</td>
                  <td>{p.status}</td>
                  <td>{p.barcodes?.join(", ")}</td>
                  <td>{p.price}</td>
                  <td>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {errorLog.length > 0 && (
        <div className="mt-4 w-full max-w-lg bg-red-900 text-white p-2 rounded-lg overflow-auto">
          <h3 className="font-semibold mb-2">Errores</h3>
          <ul>
            {errorLog.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
