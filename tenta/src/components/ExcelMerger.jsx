import { useState } from "react";
import * as XLSX from "xlsx";

export default function ExcelMerger({ onMerged }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [log, setLog] = useState([]);
  const [counters, setCounters] = useState({
    total: 0,
    toWrite: 0,
    skipped: 0,
    outOfVigencia: 0
  });

  const handleFileChange = (e, setter) => {
    setter(e.target.files[0]);
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        resolve(jsonData);
      };
      reader.onerror = () => reject("Error reading file");
      reader.readAsArrayBuffer(file);
    });
  };

  const normalizeDate = (str) => {
    // Input expected: DD/MM/YY or DD/MM/YYYY
    if (!str) return null;
    const parts = str.split("/");
    if (parts.length < 3) return null;
    let year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
    return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${year}`;
  };

  const normalizePrice = (str) => {
    if (!str) return 0;
    return parseFloat(str.toString().replace(/\./g, "").replace(",", "."));
  };

  const mergeFiles = async () => {
    if (!equivalenciasFile || !preciosFile) {
      alert("Select both files");
      return;
    }
    setLog([]);
    setCounters({ total: 0, toWrite: 0, skipped: 0, outOfVigencia: 0 });

    try {
      const [equivData, preciosData] = await Promise.all([
        parseExcel(equivalenciasFile),
        parseExcel(preciosFile)
      ]);

      const today = new Date();
      const mergedMap = {};
      const newLog = [];

      // Build barcode → productId map
      const barcodeMap = {};
      for (let i = 1; i < equivData.length; i++) {
        const row = equivData[i];
        const barcode = row[0]?.toString().trim();
        const productId = row[1]?.toString().trim();
        if (!barcode || !productId) continue;
        if (!barcodeMap[productId]) barcodeMap[productId] = [];
        barcodeMap[productId].push(barcode);
      }

      // Merge prices
      let total = 0, toWrite = 0, skipped = 0, outOfVigencia = 0;

      for (let i = 1; i < preciosData.length; i++) {
        const row = preciosData[i];
        const productId = row[0]?.toString().trim();
        if (!productId) {
          skipped++;
          newLog.push(`Row ${i + 1} skipped: no productId`);
          continue;
        }

        const vigenciaStr = row[4]?.toString().trim();
        const normalizedDate = normalizeDate(vigenciaStr);
        if (!normalizedDate) {
          skipped++;
          newLog.push(`Row ${i + 1} skipped: invalid date`);
          continue;
        }

        const vigenciaDate = new Date(normalizedDate.split("-").reverse().join("-"));
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const isOutOfVigencia = vigenciaDate < oneYearAgo;
        if (isOutOfVigencia) outOfVigencia++;

        const price = normalizePrice(row[5]);

        mergedMap[productId] = {
          productId,
          description: row[1]?.toString().trim(),
          price,
          vigencia: normalizedDate,
          barcodes: barcodeMap[productId] || []
        };
        toWrite++;
        total++;
      }

      setCounters({ total, toWrite, skipped, outOfVigencia });
      setLog(newLog);
      onMerged(Object.values(mergedMap));
    } catch (err) {
      console.error(err);
      alert("Error processing files: " + err);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2">
        <label>
          Equivalencias:
          <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, setEquivalenciasFile)} />
        </label>
      </div>
      <div className="mb-2">
        <label>
          Precios:
          <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, setPreciosFile)} />
        </label>
      </div>
      <button className="bg-blue-500 text-white px-4 py-2 mt-2" onClick={mergeFiles}>
        Merge Files
      </button>

      <div className="mt-4">
        <strong>Counters:</strong>
        <ul>
          <li>Total rows: {counters.total}</li>
          <li>To be written: {counters.toWrite}</li>
          <li>Skipped: {counters.skipped}</li>
          <li>Out of vigencia: {counters.outOfVigencia}</li>
        </ul>
      </div>

      <div className="mt-2">
        <strong>Log:</strong>
        <ul className="text-sm text-gray-700">
          {log.map((l, idx) => (
            <li key={idx}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
