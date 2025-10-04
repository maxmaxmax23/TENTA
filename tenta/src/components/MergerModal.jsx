// File: src/components/MergerModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function MergerModal({ onClose, onMerged }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [mergedData, setMergedData] = useState([]);
  const [counters, setCounters] = useState({ toWrite: 0, skipped: 0, outOfTime: 0 });
  const [error, setError] = useState(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "equivalencias") setEquivalenciasFile(file);
    if (type === "precios") setPreciosFile(file);
  };

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  const normalizeDate = (dateStr) => {
    // Accept DD/MM/YY or DD/MM/YYYY
    if (!dateStr) return null;
    const parts = dateStr.toString().split(/[\/\-]/);
    if (parts.length < 3) return null;
    let [day, month, year] = parts;
    if (year.length === 2) year = "20" + year;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  };

  const normalizePrice = (priceStr) => {
    if (!priceStr) return 0;
    // Replace comma for decimal if needed
    return parseFloat(priceStr.toString().replace(/\./g, "").replace(",", "."));
  };

  const mergeFiles = async () => {
    setError(null);
    if (!equivalenciasFile || !preciosFile) {
      setError("Both files must be selected");
      return;
    }

    try {
      const eqData = await parseExcel(equivalenciasFile);
      const preData = await parseExcel(preciosFile);

      // Remove headers
      const eqRows = eqData.slice(1);
      const preRows = preData.slice(1);

      // Build lookup for equivalencias: barcode -> productId
      const barcodeMap = {};
      eqRows.forEach(([barcode, productId, description]) => {
        if (!productId) return;
        if (!barcodeMap[productId]) barcodeMap[productId] = [];
        if (barcode) barcodeMap[productId].push(barcode.toString());
      });

      const today = new Date();
      const merged = [];
      let toWrite = 0,
        skipped = 0,
        outOfTime = 0;

      preRows.forEach((row) => {
        const [productId, desc, , , vigencia, priceRaw] = row;
        if (!productId) {
          skipped++;
          return;
        }
        const normalizedPrice = normalizePrice(priceRaw);
        const normalizedDate = normalizeDate(vigencia);

        let isOutOfTime = false;
        if (normalizedDate) {
          const [day, month, year] = normalizedDate.split("-");
          const vigDate = new Date(`${year}-${month}-${day}`);
          if (vigDate < new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())) {
            isOutOfTime = true;
            outOfTime++;
          }
        }

        const barcodes = barcodeMap[productId] || [];
        merged.push({
          productId: productId.toString(),
          description: desc,
          barcodes,
          price: normalizedPrice,
          vigencia: normalizedDate,
          outOfTime: isOutOfTime,
        });

        if (!isOutOfTime) toWrite++;
      });

      setMergedData(merged);
      setCounters({ toWrite, skipped, outOfTime });
      onMerged && onMerged(merged); // pass back to parent if needed
    } catch (e) {
      console.error(e);
      setError("Error processing files");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-lg w-11/12 max-w-3xl animate-fadeIn">
        <h2 className="text-xl font-bold mb-4">Merge Excel Files</h2>
        <div className="flex flex-col gap-3 mb-4">
          <label>
            Equivalencias:
            <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "equivalencias")} />
          </label>
          <label>
            Precios:
            <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "precios")} />
          </label>
          <button
            className="bg-black text-gold px-4 py-2 rounded"
            onClick={mergeFiles}
          >
            Merge & Preview
          </button>
        </div>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        {mergedData.length > 0 && (
          <>
            <div className="mb-4">
              <strong>Counters:</strong> To write: {counters.toWrite}, Skipped: {counters.skipped}, Out of timeframe: {counters.outOfTime}
            </div>
            <div className="max-h-64 overflow-y-auto border rounded p-2">
              <table className="w-full text-sm table-auto border-collapse">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Description</th>
                    <th>Barcodes</th>
                    <th>Price</th>
                    <th>Vigencia</th>
                    <th>Out of timeframe</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedData.map((item, idx) => (
                    <tr key={idx} className={item.outOfTime ? "text-red-600" : ""}>
                      <td>{item.productId}</td>
                      <td>{item.description}</td>
                      <td>{item.barcodes.join(", ")}</td>
                      <td>{item.price}</td>
                      <td>{item.vigencia}</td>
                      <td>{item.outOfTime ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
