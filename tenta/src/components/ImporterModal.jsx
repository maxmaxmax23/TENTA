import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase"; // your firebase instance
import { ref, uploadBytes } from "firebase/storage";
import { collection, setDoc, doc, getDoc } from "firebase/firestore";

export default function ImporterModal({ onClose }) {
  const [fileEquivalencias, setFileEquivalencias] = useState(null);
  const [filePrecios, setFilePrecios] = useState(null);
  const [logs, setLogs] = useState([]);
  const [counters, setCounters] = useState({
    toWrite: 0,
    skipped: 0,
    outOfTimeframe: 0,
  });
  const [processing, setProcessing] = useState(false);

  const parseExcel = (file) => {
    try {
      const data = XLSX.read(file, { type: "array" });
      const sheet = data.Sheets[data.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      return rows.filter((row) => row.some((cell) => cell !== ""));
    } catch (err) {
      throw new Error("Error parsing Excel: " + err.message);
    }
  };

  const normalizeDate = (value) => {
    // Expecting DD/MM/YYYY or DD/MM/YY
    if (!value) return null;
    const parts = value.split("/").map((p) => parseInt(p, 10));
    if (parts.length !== 3) return null;
    let [day, month, year] = parts;
    if (year < 100) year += 2000; // two-digit year
    return `${day.toString().padStart(2, "0")}-${month
      .toString()
      .padStart(2, "0")}-${year}`;
  };

  const handleProcess = async () => {
    if (!fileEquivalencias || !filePrecios) {
      setLogs((l) => [...l, "Debe seleccionar ambos archivos"]);
      return;
    }

    setProcessing(true);
    setLogs([]);
    setCounters({ toWrite: 0, skipped: 0, outOfTimeframe: 0 });

    try {
      const rowsEquiv = parseExcel(fileEquivalencias).slice(1); // skip headers
      const rowsPrecios = parseExcel(filePrecios).slice(1);

      // Build mapping from barcode -> productId
      const barcodeMap = {};
      rowsEquiv.forEach((row) => {
        const [barcode, productId] = row;
        if (barcode && productId) {
          if (!barcodeMap[productId]) barcodeMap[productId] = [];
          barcodeMap[productId].push(barcode.toString());
        }
      });

      let toWrite = 0,
        skipped = 0,
        outOfTimeframe = 0;

      for (const row of rowsPrecios) {
        const [productId, desc1, , desc2, vigenciaRaw, precioRaw] = row;
        if (!productId) {
          skipped++;
          continue;
        }

        const vigencia = normalizeDate(vigenciaRaw);
        const today = new Date();
        let inTimeframe = true;
        if (vigencia) {
          const [day, month, year] = vigencia.split("-").map((n) => parseInt(n, 10));
          const vigDate = new Date(year, month - 1, day);
          // Check last year
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          inTimeframe = vigDate >= oneYearAgo && vigDate <= today;
        } else {
          inTimeframe = false;
        }

        if (!inTimeframe) {
          outOfTimeframe++;
          continue;
        }

        const price = parseFloat(precioRaw.toString().replace(".", "").replace(",", "."));
        const barcodes = barcodeMap[productId] || [];

        // write to Firestore
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);
        let needWrite = true;
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only write if any field changes
          needWrite =
            data.description !== desc1 ||
            data.price !== price ||
            JSON.stringify(data.barcodes || []) !== JSON.stringify(barcodes);
        }

        if (needWrite) {
          await setDoc(docRef, {
            description: desc1,
            price,
            barcodes,
          });
          toWrite++;
        } else {
          skipped++;
        }
      }

      setCounters({ toWrite, skipped, outOfTimeframe });
      setLogs((l) => [
        ...l,
        `Importación finalizada: ${toWrite} escritos, ${skipped} sin cambios, ${outOfTimeframe} fuera de vigencia`,
      ]);
    } catch (err) {
      setLogs((l) => [...l, "Error al procesar los archivos: " + err.message]);
    }

    setProcessing(false);
  };

  return (
    <div className="importer-modal">
      <h2>Importar productos</h2>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFileEquivalencias(e.target.files[0])}
      />
      <label>Equivalencias</label>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFilePrecios(e.target.files[0])}
      />
      <label>Precios</label>
      <button onClick={handleProcess} disabled={processing}>
        {processing ? "Importando..." : "Procesar y Previsualizar"}
      </button>
      <div>
        <p>Productos a escribir: {counters.toWrite}</p>
        <p>Productos saltados: {counters.skipped}</p>
        <p>Fuera de vigencia: {counters.outOfTimeframe}</p>
      </div>
      <div>
        <h3>Logs:</h3>
        <ul>
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}
