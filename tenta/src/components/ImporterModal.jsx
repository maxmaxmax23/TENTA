import { useState } from "react";
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase.js";
import * as XLSX from "xlsx";

export default function ImporterModal({ onClose }) {
  const [files, setFiles] = useState({ equivalencias: null, precios: null });
  const [processing, setProcessing] = useState(false);
  const [counters, setCounters] = useState({ toBeWritten: 0, unchanged: 0, outOfVigencia: 0 });
  const [logs, setLogs] = useState([]);

  const handleFileChange = (e, type) => {
    setFiles((prev) => ({ ...prev, [type]: e.target.files[0] }));
  };

  const parseExcel = (file) => {
    try {
      const data = XLSX.read(file, { type: "array" });
      const sheet = data.Sheets[data.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet, { header: 1 });
    } catch (err) {
      throw new Error("Error parsing Excel: " + err.message);
    }
  };

  const normalizeDate = (input) => {
    if (!input) return null;
    const parts = input.split(/[\/\-]/); // DD/MM/YY or DD-MM-YYYY
    if (parts.length < 3) return null;
    let [day, month, year] = parts.map((p) => parseInt(p, 10));
    if (year < 100) year += 2000;
    return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  };

  const normalizePrice = (price) => {
    if (!price) return 0;
    let p = String(price).replace(/\./g, "").replace(",", ".");
    return parseFloat(p) || 0;
  };

  const mergeData = (equivalenciasRows, preciosRows) => {
    const barcodeMap = {};
    equivalenciasRows.slice(1).forEach((row) => {
      const [barcode, productId] = row;
      if (!productId) return;
      if (!barcodeMap[productId]) barcodeMap[productId] = [];
      if (barcode && !barcodeMap[productId].includes(barcode)) barcodeMap[productId].push(String(barcode));
    });

    const merged = [];
    preciosRows.slice(1).forEach((row) => {
      const [productId, desc, , , vigencia, price] = row;
      if (!productId) return;
      const normalizedDate = normalizeDate(vigencia);
      merged.push({
        productId: String(productId),
        description: desc,
        vigencia: normalizedDate,
        price: normalizePrice(price),
        barcodes: barcodeMap[productId] || []
      });
    });

    return merged;
  };

  const backupData = async (data) => {
    const timestamp = Date.now();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const backupRef = storageRef(storage, `backups/importer_backup_${timestamp}.json`);
    await uploadBytes(backupRef, blob);
    setLogs((prev) => [...prev, `Backup created: importer_backup_${timestamp}.json`]);
  };

  const writeBatchToFirestore = async (merged) => {
    let toBeWritten = 0, unchanged = 0, outOfVigencia = 0;
    const now = new Date();
    for (const product of merged) {
      if (!product.vigencia || new Date(product.vigencia) < now) {
        outOfVigencia++;
        continue;
      }
      const docRef = doc(db, "products", product.productId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, product);
        toBeWritten++;
      } else {
        const data = snap.data();
        const changed =
          data.price !== product.price ||
          data.description !== product.description ||
          JSON.stringify(data.barcodes || []) !== JSON.stringify(product.barcodes);
        if (changed) {
          await updateDoc(docRef, product);
          toBeWritten++;
        } else {
          unchanged++;
        }
      }
    }
    setCounters({ toBeWritten, unchanged, outOfVigencia });
    setLogs((prev) => [
      ...prev,
      `Write complete. ToBeWritten: ${toBeWritten}, Unchanged: ${unchanged}, OutOfVigencia: ${outOfVigencia}`
    ]);
  };

  const handleImport = async () => {
    if (!files.equivalencias || !files.precios) {
      alert("Please select both files.");
      return;
    }
    setProcessing(true);
    setLogs([]);
    setCounters({ toBeWritten: 0, unchanged: 0, outOfVigencia: 0 });

    try {
      const equivalenciasData = parseExcel(files.equivalencias);
      const preciosData = parseExcel(files.precios);
      const merged = mergeData(equivalenciasData, preciosData);
      await backupData(merged);
      await writeBatchToFirestore(merged);
    } catch (err) {
      setLogs((prev) => [...prev, "Error: " + err.message]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal">
      <h2>Importer</h2>
      <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "equivalencias")} />
      <label>Equivalencias</label>
      <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "precios")} />
      <label>Precios</label>
      <button onClick={handleImport} disabled={processing}>Process & Preview</button>
      <button onClick={onClose}>Close</button>
      <div>
        <p>Processing: {processing ? "Yes" : "No"}</p>
        <p>To Be Written: {counters.toBeWritten}</p>
        <p>Unchanged: {counters.unchanged}</p>
        <p>Out of Vigencia: {counters.outOfVigencia}</p>
        <div className="logs">
          {logs.map((log, idx) => (
            <p key={idx}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
