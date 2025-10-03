import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import {
  collection,
  doc,
  writeBatch,
  getDoc,
} from "firebase/firestore";

const ImporterModal = ({ onClose }) => {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [stats, setStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState(null);

  // --- Helpers ---
  const normalizeDate = (val) => {
    if (!val) return null;
    let d;

    // Excel serial number
    if (typeof val === "number") {
      try {
        d = XLSX.SSF.format("yyyy-mm-dd", val);
        return d;
      } catch {
        return null;
      }
    }

    const parts = String(val).trim().split(/[\/-]/);
    if (parts.length === 3) {
      let [day, month, year] = parts.map((p) => p.padStart(2, "0"));
      if (year.length === 2) year = "20" + year;
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  const normalizePrice = (val) => {
    if (val == null || val === "") return 0;
    if (typeof val === "number") return parseFloat(val.toFixed(2));
    return parseFloat(String(val).replace(",", ".").replace(/\s/g, "")) || 0;
  };

  const parseFile = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  const handleProcess = async () => {
    if (!equivalenciasFile || !preciosFile) {
      setError("Debes seleccionar ambos archivos.");
      return;
    }
    setProcessing(true);
    setError(null);

    try {
      const eqRows = await parseFile(equivalenciasFile);
      const prRows = await parseFile(preciosFile);

      // skip headers
      const equivalencias = eqRows.slice(1).map((r) => ({
        codigo: r[0] ? String(r[0]).trim() : null,
        articulo: r[1] ? String(r[1]).trim() : null,
        descripcion: r[2] ? String(r[2]).trim() : null,
      }));

      const precios = prRows.slice(1).map((r) => ({
        articulo: r[0] ? String(r[0]).trim() : null,
        desc: r[1] || "",
        lista: r[2] || "",
        descripcion: r[3] || "",
        vigencia: normalizeDate(r[4]),
        precio: normalizePrice(r[5]),
      }));

      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      let toWrite = [];
      let skipped = [];
      let outOfTimeframe = [];

      precios.forEach((precio) => {
        const eq = equivalencias.find((e) => e.articulo === precio.articulo);
        if (!eq) {
          skipped.push({ ...precio, reason: "No match in equivalencias" });
          return;
        }

        if (!precio.vigencia) {
          skipped.push({ ...precio, reason: "Fecha inválida" });
          return;
        }

        const vigDate = new Date(precio.vigencia);
        if (vigDate < oneYearAgo || vigDate > now) {
          outOfTimeframe.push({ ...precio, reason: "Fuera de rango" });
          return;
        }

        toWrite.push({
          id: eq.articulo,
          barcode: eq.codigo,
          name: precio.desc || eq.descripcion,
          price: precio.precio,
          vigencia: precio.vigencia,
        });
      });

      setPreview(toWrite);
      setStats({
        toWrite: toWrite.length,
        skipped: skipped.length,
        outOfTimeframe: outOfTimeframe.length,
      });
    } catch (err) {
      console.error(err);
      setError("Error procesando archivos.");
    } finally {
      setProcessing(false);
    }
  };

  const handleWrite = async () => {
    if (!preview.length) return;
    setWriting(true);
    try {
      const batch = writeBatch(db);
      for (const item of preview) {
        const ref = doc(collection(db, "products"), item.id);
        const snap = await getDoc(ref);

        // only write if different
        if (!snap.exists() || snap.data().price !== item.price) {
          batch.set(ref, item, { merge: true });
        }
      }
      await batch.commit();
      alert("Importación completada");
    } catch (err) {
      console.error(err);
      setError("Error al escribir en Firestore");
    } finally {
      setWriting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-lg max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Importador de productos</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={(e) => setEquivalenciasFile(e.target.files[0])}
      />
      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={(e) => setPreciosFile(e.target.files[0])}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
        onClick={handleProcess}
        disabled={processing}
      >
        {processing ? "Procesando..." : "Procesar y Previsualizar"}
      </button>

      {stats && (
        <div className="mt-4">
          <p>Para escribir: {stats.toWrite}</p>
          <p>Saltados: {stats.skipped}</p>
          <p>Fuera de vigencia: {stats.outOfTimeframe}</p>
        </div>
      )}

      {preview.length > 0 && (
        <>
          <table className="w-full border mt-4 text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Barcode</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Vigencia</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 20).map((p, i) => (
                <tr key={i}>
                  <td>{p.id}</td>
                  <td>{p.barcode}</td>
                  <td>{p.name}</td>
                  <td>{p.price}</td>
                  <td>{p.vigencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            onClick={handleWrite}
            disabled={writing}
          >
            {writing ? "Escribiendo..." : "Confirmar Importación"}
          </button>
        </>
      )}

      <button
        className="bg-gray-300 text-black px-4 py-2 rounded mt-4"
        onClick={onClose}
      >
        Cerrar
      </button>
    </div>
  );
};

export default ImporterModal;
