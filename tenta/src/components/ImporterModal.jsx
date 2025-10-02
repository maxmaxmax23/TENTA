// src/components/ImporterModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import { doc, writeBatch } from "firebase/firestore";

const ImporterModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, status: "" });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Procesar archivos XLSX
  const handleFiles = async (event) => {
    const files = event.target.files;
    if (files.length !== 2) {
      alert("⚠️ Selecciona 2 archivos: Equivalencias y Precios.");
      return;
    }

    setLogs([]);
    setProgress({ done: 0, total: 0, status: "Procesando archivos..." });

    try {
      const [file1, file2] = files;

      const data1 = await readExcel(file1);
      const data2 = await readExcel(file2);

      setLogs((prev) => [...prev, `📂 ${file1.name}: ${data1.length} filas`]);
      setLogs((prev) => [...prev, `📂 ${file2.name}: ${data2.length} filas`]);

      // Detectar cuál es Equivalencias (3 columnas) y cuál es Precios (6 columnas)
      let equivalencias, precios;
      if (data1[0].length === 3) {
        equivalencias = data1;
        precios = data2;
      } else {
        equivalencias = data2;
        precios = data1;
      }

      const merged = mergeData(equivalencias, precios);
      setLogs((prev) => [...prev, `🔗 Fusionados ${merged.length} productos`]);

      // Importar a Firebase
      await importToFirestore(merged);

    } catch (err) {
      console.error("❌ Error al procesar los archivos:", err);
      setLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  // Leer XLSX → Array de filas
  const readExcel = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
          resolve(rows.slice(1)); // ignorar headers
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  // Fusionar equivalencias + precios
  const mergeData = (equivalencias, precios) => {
    const mapEquivalencias = new Map();
    equivalencias.forEach((row) => {
      const [barcode, productId, descripcion] = row;
      if (barcode && productId) {
        mapEquivalencias.set(productId, { barcode, productId, descripcion });
      }
    });

    const merged = [];
    precios.forEach((row, idx) => {
      const [productId, descArt, lista, descripcion, vigencia, precio] = row;
      if (!productId) return;

      const eq = mapEquivalencias.get(productId);
      if (!eq) return;

      merged.push({
        id: productId.toString(),
        barcode: eq.barcode,
        descripcion: descripcion || eq.descripcion || descArt || "",
        vigencia,
        precio: parseFloat(precio) || 0,
        lista,
      });
    });

    return merged;
  };

  // Importar en lotes
  const importToFirestore = async (products) => {
    setLoading(true);
    setProgress({ done: 0, total: products.length, status: "Importando..." });

    const batchSize = 400; // throttle
    let done = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = products.slice(i, i + batchSize);

      chunk.forEach((product, idx) => {
        try {
          if (!product.id) {
            setLogs((prev) => [...prev, `⚠️ Producto sin ID en fila ${i + idx}, ignorado`]);
            return;
          }
          const ref = doc(db, "products", product.id);
          batch.set(ref, product, { merge: true });
        } catch (err) {
          setLogs((prev) => [...prev, `❌ Producto ${product.id || i + idx} error: ${err.message}`]);
        }
      });

      try {
        await batch.commit();
        done += chunk.length;
        setProgress({ done, total: products.length, status: "Importando..." });
        setLogs((prev) => [...prev, `✅ Lote importado (${done}/${products.length})`]);
      } catch (err) {
        console.error("🔥 Error en batch:", err);
        setLogs((prev) => [...prev, `🔥 Error en batch: ${err.code || ""} ${err.message}`]);
        if (err.code === "permission-denied") {
          alert("⚠️ Permisos denegados. Revisa las reglas de Firestore.");
          break;
        }
      }
    }

    setLoading(false);
    setProgress((prev) => ({ ...prev, status: "Completado ✅" }));
    setLogs((prev) => [...prev, "🎉 Importación completada"]);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white rounded-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto shadow-lg">
        <h2 className="text-lg font-bold mb-4">📦 Importar productos</h2>

        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={handleFiles}
          className="mb-4"
        />

        {loading && (
          <div className="mb-4">
            <p>
              {progress.status} {progress.done}/{progress.total}
            </p>
            <div className="w-full bg-gray-200 h-3 rounded">
              <div
                className="bg-green-600 h-3 rounded"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="bg-gray-100 p-2 rounded text-sm h-40 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImporterModal;
