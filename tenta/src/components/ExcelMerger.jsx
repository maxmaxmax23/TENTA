import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function ExcelMerger({ onMergeComplete }) {
  const [mergedCount, setMergedCount] = useState(0);
  const [status, setStatus] = useState("");

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setStatus("Leyendo archivos...");
    let allData = [];

    for (const file of files) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      allData.push(...json);
    }

    // Merge logic — normalize by product_id
    const mergedMap = {};
    for (const row of allData) {
      const productId = row["product_id"];
      const barcode = row["barcode"];
      if (!productId) continue;

      if (!mergedMap[productId]) {
        mergedMap[productId] = {
          product_id: productId,
          description: row["description"] || "",
          price: row["price"] || 0,
          barcodes: barcode ? [barcode] : [],
        };
      } else if (barcode) {
        const existing = mergedMap[productId];
        if (!existing.barcodes.includes(barcode)) {
          existing.barcodes.push(barcode);
        }
      }
    }

    const mergedArray = Object.values(mergedMap);
    setMergedCount(mergedArray.length);
    setStatus(`Combinados ${mergedArray.length} productos.`);
    onMergeComplete(mergedArray);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg text-gold mb-2">Combinar múltiples archivos Excel</h3>
      <input type="file" multiple accept=".xlsx, .xls" onChange={handleFiles} className="mb-2" />
      {status && <p className="text-sm text-gray-300">{status}</p>}
    </div>
  );
}
