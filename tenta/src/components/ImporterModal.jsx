import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ImporterModal({ onClose }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState([]);
  const [writesCounter, setWritesCounter] = useState(0);

  const readExcelFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });

  const normalizeDate = (str) => {
    const parts = str.split("/");
    if (parts.length < 3) return null;
    let year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
    return new Date(`${year}-${parts[1]}-${parts[0]}`);
  };

  const processFiles = async () => {
    if (!equivalenciasFile || !preciosFile) {
      setError("Seleccione ambos archivos: Equivalencias y Precios.");
      return;
    }

    setError(null);
    setProcessing(true);
    setPreview([]);
    setWritesCounter(0);

    try {
      const [equivalenciasData, preciosData] = await Promise.all([
        readExcelFile(equivalenciasFile),
        readExcelFile(preciosFile),
      ]);

      const eqRows = equivalenciasData.slice(1);
      const prRows = preciosData.slice(1);

      const barcodeToId = {};
      eqRows.forEach((r) => {
        const barcode = r[0]?.toString().trim();
        const productId = r[1]?.toString().trim();
        if (barcode && productId) barcodeToId[barcode] = productId;
      });

      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const previewData = prRows.map((row) => {
        const productId = row[0]?.toString().trim();
        const desc = row[1]?.toString().trim();
        const vigenciaStr = row[4]?.toString().trim();
        const priceStr = row[5]?.toString().replace(/\./g, "").replace(",", ".").trim();
        let status = "To Write";

        if (!productId || !vigenciaStr) {
          status = "Skipped";
        } else {
          const vigenciaDate = normalizeDate(vigenciaStr);
          if (!vigenciaDate || vigenciaDate < oneYearAgo) {
            status = "Out of Vigencia";
          }
        }

        const price = parseFloat(priceStr);
        if (isNaN(price)) status = "Skipped";

        const barcodes = Object.entries(barcodeToId)
          .filter(([, id]) => id === productId)
          .map(([barcode]) => barcode);

        return { productId, desc, price, barcodes, status };
      });

      setPreview(previewData);
      setWritesCounter(previewData.filter((p) => p.status === "To Write").length);
    } catch (err) {
      console.error(err);
      setError("Error al procesar los archivos.");
    } finally {
      setProcessing(false);
    }
  };

  const writeToFirebase = async () => {
    const toWrite = preview.filter((p) => p.status === "To Write");
    if (!toWrite.length) return;

    setProcessing(true);
    try {
      for (const product of toWrite) {
        const ref = doc(db, "products", product.productId);
        const snapshot = await getDoc(ref);

        const current = snapshot.exists() ? snapshot.data() : {};
        const changed =
          current.descripcion !== product.desc ||
          current.precio !== product.price ||
          JSON.stringify(current.barcodes || []) !== JSON.stringify(product.barcodes);

        if (changed) {
          await setDoc(ref, {
            descripcion: product.desc,
            precio: product.price,
            barcodes: product.barcodes,
          });
        }
      }
      alert("Importación completada con éxito.");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al escribir en Firebase.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-4xl bg-gray-900 p-6 rounded-xl shadow-lg text-gold overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Importar Productos</h2>

        <div className="flex flex-col space-y-2 mb-4">
          <label className="font-semibold">Archivo Equivalencias</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setEquivalenciasFile(e.target.files[0])}
          />
        </div>

        <div className="flex flex-col space-y-2 mb-4">
          <label className="font-semibold">Archivo Precios</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setPreciosFile(e.target.files[0])}
          />
        </div>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <div className="flex space-x-2 mb-4">
          <button
            onClick={processFiles}
            disabled={processing}
            className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {processing ? "Procesando..." : "Previsualizar"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>

        {preview.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mb-2">Resumen y Vista Previa</h3>
            <p>Productos a escribir: {writesCounter}</p>
            <p>Ignorados: {preview.filter((p) => p.status === "Skipped").length}</p>
            <p>Fuera de vigencia: {preview.filter((p) => p.status === "Out of Vigencia").length}</p>

            <div className="overflow-x-auto max-h-72 mt-2 border border-gray-600 rounded-lg">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-2 py-1">ID</th>
                    <th className="px-2 py-1">Descripción</th>
                    <th className="px-2 py-1">Precio</th>
                    <th className="px-2 py-1">Códigos</th>
                    <th className="px-2 py-1">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, i) => (
                    <tr
                      key={i}
                      className={
                        p.status === "To Write"
                          ? "bg-gray-700"
                          : p.status === "Skipped"
                          ? "bg-gray-600"
                          : "bg-gray-500"
                      }
                    >
                      <td className="px-2 py-1">{p.productId}</td>
                      <td className="px-2 py-1">{p.desc}</td>
                      <td className="px-2 py-1">{p.price}</td>
                      <td className="px-2 py-1">{p.barcodes.join(", ")}</td>
                      <td className="px-2 py-1">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={writeToFirebase}
              disabled={processing || writesCounter === 0}
              className="mt-2 px-4 py-2 bg-green-600 text-black rounded-lg hover:bg-green-500 transition"
            >
              {processing ? "Escribiendo..." : "Escribir en Firebase"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
