// File: src/components/MergerModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function MergerModal({ onClose }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [mergedData, setMergedData] = useState([]);
  const [status, setStatus] = useState("");
  const [counts, setCounts] = useState({
    written: 0,
    skipped: 0,
    outOfTimeframe: 0,
  });

  // 📅 Dynamic date range: past 12 months from now
  const now = new Date();
  const dateMax = now;
  const dateMin = new Date();
  dateMin.setFullYear(now.getFullYear() - 1);

  const normalizeDate = (dateValue) => {
    if (!dateValue) return null;
    try {
      if (typeof dateValue === "number") {
        const excelDate = XLSX.SSF.parse_date_code(dateValue);
        return new Date(excelDate.y, excelDate.m - 1, excelDate.d);
      }
      const parsed = new Date(dateValue);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  };

  const normalizePrice = (value) => {
    if (!value) return 0;
    try {
      let str = String(value)
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      const parsed = parseFloat(str);
      return isNaN(parsed) ? 0 : Math.floor(parsed);
    } catch {
      return 0;
    }
  };

  const handleMerge = async () => {
    if (!fileA || !fileB) {
      setStatus("Please upload both files first.");
      return;
    }

    try {
      setStatus("Processing...");
      setCounts({ written: 0, skipped: 0, outOfTimeframe: 0 });

      const readExcel = async (file) => {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet);
      };

      const [dataA, dataB] = await Promise.all([readExcel(fileA), readExcel(fileB)]);

      const mergedMap = new Map();
      let written = 0;
      let skipped = 0;
      let outOfTimeframe = 0;

      for (const row of [...dataA, ...dataB]) {
        const barcode = row["barcode"] || row["Código"] || row["EAN"] || row["Barra"];
        const price = normalizePrice(row["price"] || row["Precio"] || row["Importe"]);
        const dateRaw = row["date"] || row["Fecha"] || row["fecha"];
        const validDate = normalizeDate(dateRaw);

        if (!barcode || !price || !validDate) {
          skipped++;
          continue;
        }

        if (validDate < dateMin || validDate > dateMax) {
          outOfTimeframe++;
          continue;
        }

        const productId =
          row["id"] ||
          row["ProductID"] ||
          row["Código Interno"] ||
          row["Internal Code"] ||
          barcode;

        if (!mergedMap.has(productId)) {
          mergedMap.set(productId, {
            productId,
            barcodes: [barcode],
            price,
            date: validDate,
          });
          written++;
        } else {
          const existing = mergedMap.get(productId);
          if (!existing.barcodes.includes(barcode)) {
            existing.barcodes.push(barcode);
          }
          mergedMap.set(productId, existing);
        }
      }

      const finalData = Array.from(mergedMap.values());
      setMergedData(finalData);
      setCounts({ written, skipped, outOfTimeframe });
      setStatus("Merge completed successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Error processing files.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 text-gold p-4 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slideUp">
        <h2 className="text-xl font-bold mb-3 text-center">Merge Excel Files</h2>

        <div className="flex flex-col gap-2">
          <label className="block text-sm">Upload File A</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFileA(e.target.files[0])}
            className="text-black p-1 rounded"
          />

          <label className="block text-sm">Upload File B</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFileB(e.target.files[0])}
            className="text-black p-1 rounded"
          />

          <button
            onClick={handleMerge}
            className="bg-gold text-black mt-3 py-2 rounded font-semibold"
          >
            Merge Files
          </button>
        </div>

        <div className="mt-4 text-sm">
          <p>Status: {status}</p>
          <p>🟢 To Write: {counts.written}</p>
          <p>🟡 Skipped: {counts.skipped}</p>
          <p>🔴 Out of Timeframe: {counts.outOfTimeframe}</p>
          <p className="text-xs mt-1 opacity-70">
            (Date range: {dateMin.toLocaleDateString()} → {dateMax.toLocaleDateString()})
          </p>
        </div>

        {mergedData.length > 0 && (
          <div className="mt-3 max-h-60 overflow-y-auto border-t border-zinc-700 pt-2 text-xs">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Product ID</th>
                  <th className="text-left">Barcodes</th>
                  <th className="text-left">Price</th>
                  <th className="text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {mergedData.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productId}</td>
                    <td>{item.barcodes.join(", ")}</td>
                    <td>{item.price}</td>
                    <td>{item.date?.toLocaleDateString?.() || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 rounded bg-zinc-800 text-gold border border-gold hover:bg-zinc-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
