import { useState } from "react";
import { firestore } from "../firebase.js";
import { collection, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import * as XLSX from "xlsx";


export default function ExcelMerger({ onMerge }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [log, setLog] = useState([]);
  const [mergedData, setMergedData] = useState(null);

  // Normaliza fecha a formato YYYY-MM-DD
  const normalizeDate = (value) => {
    if (!value) return null;
    try {
      if (typeof value === "number") {
        return XLSX.SSF.format("dd-mm-yyyy", value);
      }
      if (typeof value === "string") {
        const parts = value.replace(/\s/g, "").split(/[\/\-]/);
        if (parts.length === 3) {
          let [day, month, year] = parts;
          if (year.length === 2) year = "20" + year; 
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }
    } catch (err) {
      console.error("Error normalizing date:", err);
    }
    return null;
  };

  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "equivalencias") setEquivalenciasFile(file);
    else setPreciosFile(file);
  };

  const processFiles = async () => {
    setLog(["Procesando archivos..."]);

    if (!equivalenciasFile || !preciosFile) {
      setLog((prev) => [...prev, "Debes seleccionar ambos archivos."]);
      return;
    }

    try {
      // Leer equivalencias
      const eqBuffer = await equivalenciasFile.arrayBuffer();
      const eqWorkbook = XLSX.read(eqBuffer, { type: "array" });
      const eqSheet = eqWorkbook.Sheets[eqWorkbook.SheetNames[0]];
      const eqRows = XLSX.utils.sheet_to_json(eqSheet, { header: 1 });

      // Leer precios
      const prBuffer = await preciosFile.arrayBuffer();
      const prWorkbook = XLSX.read(prBuffer, { type: "array" });
      const prSheet = prWorkbook.Sheets[prWorkbook.SheetNames[0]];
      const prRows = XLSX.utils.sheet_to_json(prSheet, { header: 1 });

      let logEntries = [];
      let productsMap = {};

      // Procesar equivalencias
      eqRows.slice(1).forEach((row, idx) => {
        const barcode = String(row[0] || "").trim();
        const productId = String(row[1] || "").trim();
        const description = String(row[2] || "").trim();

        if (!productId) {
          logEntries.push(`Fila ${idx + 2} en equivalencias sin Articulo`);
          return;
        }

        if (!productsMap[productId]) {
          productsMap[productId] = {
            productId,
            description,
            barcodes: [],
          };
        }

        if (barcode && !productsMap[productId].barcodes.includes(barcode)) {
          productsMap[productId].barcodes.push(barcode);
        }
      });

      // Procesar precios
      prRows.slice(1).forEach((row, idx) => {
        const productId = String(row[0] || "").trim();
        const description = String(row[1] || "").trim();
        const vigencia = normalizeDate(row[4]);
        let priceRaw = row[5];

        // Normalizar precio
        let price = 0;
        if (typeof priceRaw === "string") {
          price = parseFloat(
            priceRaw.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "")
          );
        } else if (typeof priceRaw === "number") {
          price = priceRaw;
        }

        if (!productId) {
          logEntries.push(`Fila ${idx + 2} en precios sin Articulo`);
          return;
        }

        if (!productsMap[productId]) {
          productsMap[productId] = {
            productId,
            description,
            barcodes: [],
          };
        }

        productsMap[productId].description =
          description || productsMap[productId].description;
        productsMap[productId].price = price;
        productsMap[productId].vigencia = vigencia;
      });

      const mergedList = Object.values(productsMap);
      setMergedData(mergedList);

      logEntries.push(`✅ Total productos únicos: ${mergedList.length}`);
      logEntries.push(
        `📦 Ejemplo primer producto: ${JSON.stringify(mergedList[0])}`
      );

      setLog(logEntries);

      if (onMerge) onMerge(mergedList);
    } catch (err) {
      console.error("Error procesando archivos:", err);
      setLog((prev) => [...prev, `Error: ${err.message}`]);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-900 text-white">
      <h2 className="text-lg font-bold mb-2">Excel Merger</h2>

      <div className="space-y-2">
        <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFile(e, "equivalencias")} />
        <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFile(e, "precios")} />
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        onClick={processFiles}
      >
        Procesar Archivos
      </button>

      <div className="mt-4 text-sm whitespace-pre-wrap bg-black/40 p-2 rounded">
        {log.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>

      {mergedData && (
        <div className="mt-4">
          <h3 className="font-bold">Resumen:</h3>
          <p>Productos únicos: {mergedData.length}</p>
        </div>
      )}
    </div>
  );
}
