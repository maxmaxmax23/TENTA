// src/components/ImporterModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function ImporterModal({ user, initialWrites = 0, onWritesUpdate, onClose }) {
  const [equivFile, setEquivFile] = useState(null);
  const [precioFile, setPrecioFile] = useState(null);
  const [log, setLog] = useState([]);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [written, setWritten] = useState(initialWrites);
  const [processedCount, setProcessedCount] = useState(0);
  const [toWriteCount, setToWriteCount] = useState(0);

  const BATCH_SIZE = 500;
  const BATCH_DELAY_MS = 200; // throttle between batch commits (adjustable)

  const appendLog = (line) => setLog((l) => [...l, `${new Date().toISOString()} - ${line}`]);

  // Robust vigencia parse: Excel serial, DD/MM/YYYY, JS Date
  const parseVigencia = (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") {
      try {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
      } catch (e) {
        // fallback
      }
    }
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const s = String(value).trim();
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let [, dd, mm, yy] = m;
      if (yy.length === 2) yy = "20" + yy;
      const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
      return isNaN(d.getTime()) ? null : d;
    }
    const d2 = new Date(s);
    return isNaN(d2.getTime()) ? null : d2;
  };

  const readFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  };

  // Merge preview (no writes)
  const handleMergePreview = async () => {
    if (!equivFile || !precioFile) {
      alert("Selecciona ambos archivos (Equivalencias y Precios).");
      return;
    }

    setProcessing(true);
    setLog([]);
    setPreview(null);
    setProcessedCount(0);
    setToWriteCount(0);

    try {
      const equivRows = (await readFile(equivFile)).slice(1); // skip header
      const precioRows = (await readFile(precioFile)).slice(1); // skip header

      const localLog = [];

      // Build map: productId (Codigo) => {Articulo(barcode), DescripcionEquiv}
      const equivMap = new Map();
      equivRows.forEach((row, idx) => {
        if (!row || row.length < 2) {
          localLog.push(`Equivalencias fila ${idx + 2} ignorada (columnas insuficientes)`);
          return;
        }
        const barcode = String(row[0] ?? "").trim();
        const codigo = String(row[1] ?? "").trim();
        const desc = String(row[2] ?? "").trim();
        if (!codigo || !barcode) {
          localLog.push(`Equivalencias fila ${idx + 2} ignorada (codigo/barcode vacío)`);
          return;
        }
        equivMap.set(codigo, { Articulo: barcode, DescripcionEquiv: desc });
      });

      const merged = [];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      for (let i = 0; i < precioRows.length; i++) {
        const row = precioRows[i];
        const rowIndex = i + 2; // header skip accounted
        const cols = [...row];
        while (cols.length < 6) cols.push("");
        const productId = String(cols[0] ?? "").trim();
        const descripcion = String(cols[1] ?? "").trim();
        const lista = String(cols[2] ?? "").trim();
        const nombreListaAnterior = String(cols[3] ?? "").trim();
        const vigenciaRaw = cols[4];
        const precioRaw = cols[5];

        if (!productId) {
          localLog.push(`Precios fila ${rowIndex} ignorada (productId vacío)`);
          continue;
        }

        const vigDate = parseVigencia(vigenciaRaw);
        if (!vigDate) {
          localLog.push(`Precios fila ${rowIndex} ignorada (Vigencia inválida: "${vigenciaRaw}")`);
          continue;
        }
        if (vigDate < oneYearAgo) {
          localLog.push(`Precios fila ${rowIndex} filtrada (Vigencia fuera de rango)`);
          continue;
        }

        const equiv = equivMap.get(productId);
        if (!equiv) {
          localLog.push(`Precios fila ${rowIndex} ignorada (sin equivalencia para id ${productId})`);
          continue;
        }

        // normalize price
        let precioNum = null;
        if (precioRaw !== "" && precioRaw !== null && precioRaw !== undefined) {
          const pStr = String(precioRaw).replace(/\s/g, "").replace(",", ".");
          const pNum = Number(pStr);
          precioNum = isNaN(pNum) ? null : pNum;
        }

        merged.push({
          id: productId,
          Articulo: equiv.Articulo,
          Descripcion: descripcion || equiv.DescripcionEquiv || "",
          Lista: lista,
          NombreListaAnterior: nombreListaAnterior,
          VigenciaISO: vigDate.toISOString(),
          Precio: precioNum,
          sourceRow: rowIndex,
        });

        // keep processedCount moving for big files
        if (i % 200 === 0) setProcessedCount((c) => c + 200);
      }

      setProcessedCount(merged.length);
      setPreview({ merged, totalPrecios: precioRows.length, totalMerged: merged.length });
      setLog((l) => [...l, ...localLog]);
      appendLog(`Merge complete: ${merged.length} items ready`);
    } catch (err) {
      console.error(err);
      appendLog("Error al procesar archivos: " + (err.message || err));
      alert("Error al procesar los archivos — revisa la consola.");
    } finally {
      setProcessing(false);
    }
  };

  // backup to Storage and write metadata (one small write)
  const backupToStorage = async () => {
    const timestamp = new Date().toISOString();
    const filename = `backups/${timestamp}_products.json`;

    // read all products
    appendLog("Leyendo productos actuales para backup...");
    const productsSnap = await getDocs(collection(db, "products"));
    const products = productsSnap.docs.map((d) => d.data());

    const payload = { products, timestamp, user: user?.email || "unknown" };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const sRef = storageRef(storage, filename);
    await uploadBytes(sRef, blob);
    const url = await getDownloadURL(sRef);

    // metadata doc
    const metaRef = doc(collection(db, "backups_meta"), timestamp);
    await setDoc(metaRef, { path: filename, downloadURL: url, timestamp, user: user?.email || "unknown" });

    // rotation: keep last 3 by timestamp
    try {
      const metaSnap = await getDocs(collection(db, "backups_meta"));
      const docs = metaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      if (docs.length > 3) {
        const toRemove = docs.slice(3);
        for (const r of toRemove) {
          try {
            if (r.path) await deleteObject(storageRef(storage, r.path));
          } catch (e) {
            // ignore deletion errors
          }
          try {
            await deleteDoc(doc(collection(db, "backups_meta"), r.id));
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn("backup rotation failed", e);
    }

    return { path: filename, downloadURL: url, timestamp };
  };

  const validateProduct = (p) => {
    if (!p || !p.id) return { ok: false, reason: "id missing" };
    if (!p.VigenciaISO) return { ok: false, reason: "vigencia missing" };
    if (p.Precio === null || p.Precio === undefined || isNaN(Number(p.Precio))) return { ok: false, reason: "precio invalid" };
    return { ok: true };
  };

  const isDifferent = (existing, candidate) => {
    if (!existing) return true;
    if (String(existing.Descripcion || "") !== String(candidate.Descripcion || "")) return true;
    const ePrice = Number(existing.Precio);
    const cPrice = Number(candidate.Precio);
    if (isNaN(ePrice) && !isNaN(cPrice)) return true;
    if (!isNaN(ePrice) && ePrice !== cPrice) return true;
    if ((existing.Vigencia || existing.VigenciaISO || "") !== (candidate.Vigencia || candidate.VigenciaISO || "")) return true;
    return false;
  };

  // Throttle util
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // main import: backup -> compute changed -> batch writes with throttle
  const handleImport = async () => {
    if (!preview || !preview.merged || preview.merged.length === 0) {
      alert("No hay items listos para importar.");
      return;
    }
    if (!window.confirm(`Importar ${preview.merged.length} items a Firestore? Se creará un backup en Storage antes de escribir.`)) return;

    setProcessing(true);
    appendLog("Iniciando backup a Storage...");

    try {
      const backupMeta = await backupToStorage();
      appendLog(`Backup subido: ${backupMeta.path}`);

      appendLog("Leyendo productos existentes...");
      const existingSnap = await getDocs(collection(db, "products"));
      const existingMap = new Map(existingSnap.docs.map((d) => [d.id, d.data()]));

      // compute toWrite
      const toWrite = [];
      const failures = [];
      for (const item of preview.merged) {
        const candidate = {
          id: item.id,
          Articulo: item.Articulo,
          Descripcion: item.Descripcion,
          Lista: item.Lista,
          NombreListaAnterior: item.NombreListaAnterior,
          Vigencia: item.VigenciaISO,
          Precio: item.Precio,
          importedBy: user?.email || "unknown",
          importedAt: new Date().toISOString(),
        };
        const v = validateProduct(candidate);
        if (!v.ok) {
          failures.push({ id: candidate.id, reason: v.reason });
          appendLog(`Skipping ${candidate.id}: ${v.reason}`);
          continue;
        }
        const existing = existingMap.get(candidate.id);
        if (isDifferent(existing, candidate)) toWrite.push(candidate);
      }

      appendLog(`Items detectados para escritura (cambios): ${toWrite.length}`);
      setToWriteCount(toWrite.length);

      // batch commit with throttle
      let writtenSoFar = 0;
      for (let i = 0; i < toWrite.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = toWrite.slice(i, i + BATCH_SIZE);
        chunk.forEach((p) => batch.set(doc(db, "products", p.id), p));
        try {
          await batch.commit();
          writtenSoFar += chunk.length;
          setWritten((w) => w + chunk.length);
          appendLog(`Batch escrito: ${chunk.length} items (${Math.min(writtenSoFar, toWrite.length)}/${toWrite.length})`);
        } catch (batchErr) {
          console.error("Batch commit failed", batchErr);
          appendLog(`ERROR: batch commit failed - ${batchErr.message || batchErr}`);
        }
        // throttle before next batch
        if (i + BATCH_SIZE < toWrite.length) await delay(BATCH_DELAY_MS);
      }

      appendLog(`Import finalizado. Escritos: ${writtenSoFar}. Fallidos/validados: ${failures.length}`);
      if (onWritesUpdate) onWritesUpdate(written + writtenSoFar);
      alert(`Import completado. Escritos: ${writtenSoFar}. Revisa el log para detalles.`);
      // reset preview / files
      setPreview(null);
      setEquivFile(null);
      setPrecioFile(null);
    } catch (err) {
      console.error("Import failed", err);
      appendLog("Error en import: " + (err.message || err));
      alert("Error durante la importación — revisa la consola/log.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 overflow-auto z-50">
      <div className="w-11/12 max-w-3xl bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Importar Excel — Equivalencias + Precios</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <input type="file" accept=".xls,.xlsx" onChange={(e) => setEquivFile(e.target.files[0])} />
            <p className="text-sm text-gray-400">Equivalencias: col0=barcode, col1=productId, col2=descripcion (header skipped)</p>
          </div>
          <div>
            <input type="file" accept=".xls,.xlsx" onChange={(e) => setPrecioFile(e.target.files[0])} />
            <p className="text-sm text-gray-400">Precios: col0=productId, col4=vigencia (DD/MM/YY or Excel date), col5=precio (header skipped)</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={handleMergePreview} disabled={processing} className="flex-1 py-2 bg-gold text-black rounded">
            {processing ? "Procesando..." : "Previsualizar / Combinar"}
          </button>
          <button onClick={handleImport} disabled={processing || !preview} className="flex-1 py-2 bg-green-600 text-black rounded">
            {processing ? "Importando..." : "Importar (Backup en Storage)"}
          </button>
          <button onClick={onClose} className="py-2 px-4 bg-gray-700 text-gold rounded">Cerrar</button>
        </div>

        {preview && (
          <div className="mt-4 p-3 bg-gray-800 rounded">
            <p>Total filas Precios: {preview.totalPrecios}</p>
            <p>Items combinados (listos): {preview.totalMerged}</p>
            <p>Items a escribir (cambios detectados): {toWriteCount}</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-black bg-opacity-40 rounded h-56 overflow-auto">
          <p className="text-sm text-gray-400">Processed: {processedCount} | Writes acc: {written} | ToWrite: {toWriteCount}</p>
          <div className="text-xs mt-2 space-y-1">
            {log.map((l, i) => <div key={i} className="text-yellow-300">{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
