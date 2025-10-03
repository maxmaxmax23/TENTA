import React, { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js"; // Make sure your firebase.js exports 'db'
import * as XLSX from "xlsx";

export default function ImporterModal({ isOpen, onClose }) {
  const [fileEquiv, setFileEquiv] = useState(null);
  const [filePrice, setFilePrice] = useState(null);
  const [preview, setPreview] = useState([]);
  const [counts, setCounts] = useState({ toWrite: 0, skipped: 0, outOfTime: 0 });
  const [processing, setProcessing] = useState(false);
  const [errorLog, setErrorLog] = useState([]);

  const handleFileChange = (e, type) => {
    if (e.target.files.length > 0) {
      type === "equiv" ? setFileEquiv(e.target.files[0]) : setFilePrice(e.target.files[0]);
    }
  };

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    return rows;
  };

  const normalizeDate = (dateStr) => {
    // Converts DD/MM/YY or DD/MM/YYYY to Date object
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    let year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
    return new Date(`${year}-${parts[1]}-${parts[0]}`);
  };

  const normalizePrice = (priceStr) => {
    if (!priceStr) return 0;
    let normalized = priceStr.toString().replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized) || 0;
  };

  const processFiles = async () => {
    if (!fileEquiv || !filePrice) {
      alert("Por favor selecciona ambos archivos");
      return;
    }

    setProcessing(true);
    setErrorLog([]);
    const logs = [];
    try {
      const equivRows = await parseExcel(fileEquiv);
      const priceRows = await parseExcel(filePrice);

      const productMap = {};

      // Process equivalencias (skip header)
      equivRows.slice(1).forEach((row, index) => {
        try {
          const barcode = row[0].toString().trim();
          const productId = row[1].toString().trim();
          if (!productId) return; // skip empty
          if (!productMap[productId]) productMap[productId] = { barcodes: [], data: {} };
          if (barcode && !productMap[productId].barcodes.includes(barcode)) {
            productMap[productId].barcodes.push(barcode);
          }
        } catch (err) {
          logs.push(`Equivalencias row ${index + 2}: ${err.message}`);
        }
      });

      // Process precios (skip header)
      priceRows.slice(1).forEach((row, index) => {
        try {
          const productId = row[0].toString().trim();
          if (!productMap[productId]) return; // skip unmatched
          const description = row[1].toString().trim();
          const vigenciaStr = row[4].toString().trim();
          const vigenciaDate = normalizeDate(vigenciaStr);
          const price = normalizePrice(row[5]);

          productMap[productId].data = { description, vigencia: vigenciaDate, price };
        } catch (err) {
          logs.push(`Precios row ${index + 2}: ${err.message}`);
        }
      });

      // Build preview
      let toWrite = 0,
        skipped = 0,
        outOfTime = 0;
      const today = new Date();
      const previewArr = [];

      for (const [productId, info] of Object.entries(productMap)) {
        if (!info.data.vigencia || info.data.vigencia > today) {
          previewArr.push({ productId, ...info.data, barcodes: info.barcodes, status: "outOfTime" });
          outOfTime++;
        } else if (!info.data.description) {
          previewArr.push({ productId, ...info.data, barcodes: info.barcodes, status: "skipped" });
          skipped++;
        } else {
          previewArr.push({ productId, ...info.data, barcodes: info.barcodes, status: "toWrite" });
          toWrite++;
        }
      }

      setPreview(previewArr);
      setCounts({ toWrite, skipped, outOfTime });
      setErrorLog(logs);
    } catch (err) {
      setErrorLog([`Error general: ${err.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  const writeToFirebase = async () => {
    const batchLogs = [];
    for (const item of preview.filter((p) => p.status === "toWrite")) {
      try {
        const docRef = doc(db, "products", item.productId);
        const snap = await getDoc(docRef);
        const currentData = snap.exists() ? snap.data() : {};
        let needsUpdate = false;

        // Only update if changed
        if (
          JSON.stringify(currentData) !==
          JSON.stringify({ description: item.description, price: item.price, barcodes: item.barcodes })
        ) {
          needsUpdate = true;
          await setDoc(docRef, {
            description: item.description,
            price: item.price,
            barcodes: item.barcodes,
          });
        }
        batchLogs.push(`${item.productId}: ${needsUpdate ? "Written" : "Skipped"}`);
      } catch (err) {
        batchLogs.push(`${item.productId}: ERROR ${err.message}`);
      }
    }
    setErrorLog((prev) => [...prev, ...batchLogs]);
    alert("Importación finalizada!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 w-full max-w-3xl rounded-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Importar Productos</h2>
        <div className="mb-2">
          <label>Archivo Equivalencias</label>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileChange(e, "equiv")} />
        </div>
        <div className="mb-2">
          <label>Archivo Precios</label>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileChange(e, "price")} />
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          onClick={processFiles}
          disabled={processing}
        >
          {processing ? "Procesando..." : "Previsualizar"}
        </button>
        {preview.length > 0 && (
          <>
            <h3 className="mt-4 font-semibold">Resumen</h3>
            <p>Para escribir: {counts.toWrite}</p>
            <p>Omitidos: {counts.skipped}</p>
            <p>Fuera de Vigencia: {counts.outOfTime}</p>
            <table className="table-auto border-collapse border border-gray-300 mt-2 w-full">
              <thead>
                <tr>
                  <th className="border px-2 py-1">ID</th>
                  <th className="border px-2 py-1">Descripción</th>
                  <th className="border px-2 py-1">Barcodes</th>
                  <th className="border px-2 py-1">Precio</th>
                  <th className="border px-2 py-1">Vigencia</th>
                  <th className="border px-2 py-1">Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item) => (
                  <tr key={item.productId}>
                    <td className="border px-2 py-1">{item.productId}</td>
                    <td className="border px-2 py-1">{item.description}</td>
                    <td className="border px-2 py-1">{item.barcodes.join(", ")}</td>
                    <td className="border px-2 py-1">{item.price}</td>
                    <td className="border px-2 py-1">
                      {item.vigencia ? item.vigencia.toLocaleDateString() : "-"}
                    </td>
                    <td className="border px-2 py-1">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded mt-2"
              onClick={writeToFirebase}
            >
              Escribir en Firebase
            </button>
          </>
        )}
        {errorLog.length > 0 && (
          <div className="mt-4 bg-red-100 text-red-700 p-2 rounded max-h-40 overflow-y-auto">
            <h4 className="font-semibold">Errores / Log</h4>
            <ul>
              {errorLog.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        <button className="mt-4 text-gray-500 underline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
