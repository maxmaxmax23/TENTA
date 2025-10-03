import { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js"; // your Firebase config
import { ref, uploadBytes } from "firebase/storage";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";

export default function ImporterModal() {
  const [files, setFiles] = useState({ equivalencias: null, precios: null });
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState([]);
  const [counters, setCounters] = useState({
    written: 0,
    changed: 0,
    skipped: 0,
    outOfVigencia: 0,
  });

  const handleFileChange = (e, type) => {
    setFiles({ ...files, [type]: e.target.files[0] });
  };

  const normalizeDate = (value) => {
    if (!value) return null;
    const parts = value.toString().split(/[\/\-]/);
    if (parts.length !== 3) return null;
    let [d, m, y] = parts.map((p) => parseInt(p, 10));
    if (y < 100) y += 2000; // handle YY format
    return new Date(y, m - 1, d);
  };

  const normalizePrice = (value) => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    return parseFloat(
      value.toString().replace(/[^\d,-]/g, "").replace(",", ".")
    );
  };

  const processFiles = async () => {
    if (!files.equivalencias || !files.precios) {
      alert("Selecciona ambos archivos: Equivalencias y Precios");
      return;
    }

    setProcessing(true);
    setLog([]);
    setCounters({ written: 0, changed: 0, skipped: 0, outOfVigencia: 0 });

    try {
      // Read files
      const eqData = XLSX.read(await files.equivalencias.arrayBuffer(), {
        type: "array",
      });
      const eqSheet = XLSX.utils.sheet_to_json(eqData.Sheets[eqData.SheetNames[0]], { header: 1 });
      
      const prData = XLSX.read(await files.precios.arrayBuffer(), {
        type: "array",
      });
      const prSheet = XLSX.utils.sheet_to_json(prData.Sheets[prData.SheetNames[0]], { header: 1 });

      // Remove headers
      eqSheet.shift();
      prSheet.shift();

      // Build mapping: productId -> barcodes
      const prodMap = {};
      eqSheet.forEach((row, idx) => {
        const barcode = row[0];
        const productId = row[1];
        if (!productId || !barcode) {
          setLog((prev) => [...prev, `Fila ${idx + 2} equivalencias inválida`]);
          setCounters((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
          return;
        }
        if (!prodMap[productId]) prodMap[productId] = { barcodes: [] };
        if (!prodMap[productId].barcodes.includes(barcode)) prodMap[productId].barcodes.push(barcode);
      });

      // Process precios
      for (let i = 0; i < prSheet.length; i++) {
        const row = prSheet[i];
        const productId = row[0];
        const description = row[1] || "";
        const listName = row[3] || "";
        const vigencia = normalizeDate(row[4]);
        const price = normalizePrice(row[5]);

        if (!productId) {
          setLog((prev) => [...prev, `Fila ${i + 2} precios sin productId`]);
          setCounters((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
          continue;
        }

        if (!vigencia || vigencia > new Date()) {
          setLog((prev) => [...prev, `Fila ${i + 2} fuera de vigencia`]);
          setCounters((prev) => ({ ...prev, outOfVigencia: prev.outOfVigencia + 1 }));
          continue;
        }

        const docRef = doc(db, "products", productId);
        const existingDoc = await getDoc(docRef);
        let shouldWrite = true;
        if (existingDoc.exists()) {
          const data = existingDoc.data();
          if (
            data.description === description &&
            data.price === price &&
            JSON.stringify(data.barcodes) === JSON.stringify(prodMap[productId]?.barcodes || [])
          ) {
            shouldWrite = false;
          }
        }

        if (shouldWrite) {
          await setDoc(docRef, {
            description,
            price,
            barcodes: prodMap[productId]?.barcodes || [],
            listName,
            vigencia: vigencia.toISOString(),
          });
          setCounters((prev) => ({
            ...prev,
            written: prev.written + 1,
            changed: existingDoc.exists() ? prev.changed + 1 : prev.changed,
          }));
        } else {
          setCounters((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
        }
      }
      setLog((prev) => [...prev, "Importación finalizada"]);
    } catch (err) {
      console.error(err);
      setLog((prev) => [...prev, `Error procesando archivos: ${err.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="importer-modal">
      <h2>Importador</h2>
      <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "equivalencias")} />
      <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "precios")} />
      <button disabled={processing} onClick={processFiles}>
        {processing ? "Importando..." : "Procesar y previsualizar"}
      </button>

      <div className="counters">
        <p>Escritos: {counters.written}</p>
        <p>Cambiados: {counters.changed}</p>
        <p>Saltados: {counters.skipped}</p>
        <p>Fuera de vigencia: {counters.outOfVigencia}</p>
      </div>

      <div className="log">
        {log.map((l, idx) => (
          <p key={idx}>{l}</p>
        ))}
      </div>
    </div>
  );
}
