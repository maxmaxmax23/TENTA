// File: src/components/MergerModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function MergerModal({ onClose }) {
  const [equivFile, setEquivFile] = useState(null);
  const [priceFile, setPriceFile] = useState(null);
  const [mergedData, setMergedData] = useState([]);
  const [counters, setCounters] = useState({ toWrite: 0, skipped: 0, outOfTime: 0 });
  const [errorLog, setErrorLog] = useState([]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "equiv") setEquivFile(file);
    else setPriceFile(file);
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const normalizeDate = (str) => {
    if (!str) return null;
    const parts = str.toString().split(/[\/\-]/);
    if (parts.length !== 3) return null;
    let [day, month, year] = parts.map((p) => parseInt(p, 10));
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day);
  };

  const normalizePrice = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    return parseFloat(val.toString().replace(/\./g, "").replace(",", "."));
  };

  const handleMerge = async () => {
    setErrorLog([]);
    if (!equivFile || !priceFile) {
      setErrorLog(["Ambos archivos deben ser seleccionados"]);
      return;
    }

    try {
      const equivRows = await parseExcel(equivFile);
      const priceRows = await parseExcel(priceFile);

      // Skip headers
      const equivData = equivRows.slice(1);
      const priceData = priceRows.slice(1);

      const mergedMap = new Map();
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      // Process equivalencias
      equivData.forEach((row, idx) => {
        const [barcode, productId, description] = row;
        if (!productId) {
          setErrorLog((prev) => [...prev, `Fila ${idx + 2}: Product ID vacío`]);
          return;
        }
        mergedMap.set(productId, {
          productId,
          barcodes: barcode ? [barcode.toString()] : [],
          description: description || "",
          price: null,
          vigencia: null,
          status: "toWrite", // default
        });
      });

      // Process precios
      priceData.forEach((row, idx) => {
        const [productId, desc, , , vig, price] = row;
        if (!productId) {
          setErrorLog((prev) => [...prev, `Fila precios ${idx + 2}: Product ID vacío`]);
          return;
        }
        if (!mergedMap.has(productId)) {
          setErrorLog((prev) => [...prev, `Fila precios ${idx + 2}: Product ID no encontrado en equivalencias`]);
          return;
        }
        const prod = mergedMap.get(productId);
        prod.description = desc || prod.description;
        prod.price = normalizePrice(price);
        prod.vigencia = normalizeDate(vig);

        // Check vigencia
        if (!prod.vigencia || prod.vigencia < oneYearAgo) prod.status = "outOfTime";
      });

      // Calculate counters
      let toWrite = 0, skipped = 0, outOfTime = 0;
      mergedMap.forEach((prod) => {
        if (prod.status === "toWrite") toWrite++;
        else if (prod.status === "outOfTime") outOfTime++;
        else skipped++;
      });

      setMergedData(Array.from(mergedMap.values()));
      setCounters({ toWrite, skipped, outOfTime });
    } catch (err) {
      setErrorLog([`Error al procesar los archivos: ${err.message}`]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-black text-gold p-6 rounded-lg w-full max-w-4xl overflow-auto animate-fadeIn">
        <h2 className="text-xl font-bold mb-4">Merger Preview</h2>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block mb-1">Equivalencias</label>
            <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "equiv")} />
          </div>
          <div>
            <label className="block mb-1">Precios</label>
            <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "price")} />
          </div>
        </div>

        <button
          onClick={handleMerge}
          className="bg-gold text-black px-4 py-2 rounded mb-4 hover:opacity-80"
        >
          Merge & Preview
        </button>

        {errorLog.length > 0 && (
          <div className="bg-red-800 text-red-100 p-2 mb-4 rounded">
            {errorLog.map((err, idx) => (
              <div key={idx}>{err}</div>
            ))}
          </div>
        )}

        {mergedData.length > 0 && (
          <>
            <div className="mb-2">
              <span>To Write: {counters.toWrite}</span>{" | "}
              <span>Skipped: {counters.skipped}</span>{" | "}
              <span>Out of Timeframe: {counters.outOfTime}</span>
            </div>
            <div className="overflow-auto max-h-96 border border-gold rounded">
              <table className="w-full text-left">
                <thead className="bg-gold text-black">
                  <tr>
                    <th className="px-2 py-1">Product ID</th>
                    <th className="px-2 py-1">Barcodes</th>
                    <th className="px-2 py-1">Description</th>
                    <th className="px-2 py-1">Price</th>
                    <th className="px-2 py-1">Vigencia</th>
                    <th className="px-2 py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedData.map((prod, idx) => (
                    <tr
                      key={idx}
                      className={
                        prod.status === "outOfTime"
                          ? "text-red-500"
                          : prod.status === "skipped"
                          ? "text-gray-400"
                          : ""
                      }
                    >
                      <td className="px-2 py-1">{prod.productId}</td>
                      <td className="px-2 py-1">{prod.barcodes.join(", ")}</td>
                      <td className="px-2 py-1">{prod.description}</td>
                      <td className="px-2 py-1">{prod.price}</td>
                      <td className="px-2 py-1">{prod.vigencia ? prod.vigencia.toLocaleDateString() : ""}</td>
                      <td className="px-2 py-1">{prod.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="bg-gray-800 text-gold px-4 py-2 rounded mt-4 hover:opacity-80"
        >
          Close
        </button>
      </div>
    </div>
  );
}
