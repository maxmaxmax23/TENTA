import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase.js";
import { collection, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";

export default function ImporterModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({
    toWrite: [],
    skipped: [],
    outOfVigencia: [],
  });
  const [firebaseWrites, setFirebaseWrites] = useState(0);
  const [error, setError] = useState("");

  const handleFilesChange = (e) => {
    setFiles(e.target.files);
  };

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const normalized = priceStr.toString().replace(/\./g, "").replace(",", ".");
    const value = parseFloat(normalized);
    return isNaN(value) ? 0 : value;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [d, m, y] = dateStr.split("/").map((x) => parseInt(x, 10));
    return new Date(y + 2000 * (y < 100 ? 1 : 0), m - 1, d);
  };

  const mergeExcels = (equivalenciasData, preciosData) => {
    const merged = [];

    const equivalenciasMap = {};
    equivalenciasData.slice(1).forEach((row) => {
      const [barcode, productId, description] = row;
      if (productId) equivalenciasMap[productId] = { barcode, description };
    });

    preciosData.slice(1).forEach((row) => {
      const [productId, descArt, , , vigenciaStr, priceStr] = row;
      if (!productId) return;
      const vigencia = parseDate(vigenciaStr);
      const price = parsePrice(priceStr);
      const eq = equivalenciasMap[productId];
      merged.push({
        productId,
        barcode: eq ? eq.barcode : null,
        description: eq ? eq.description : descArt,
        price,
        vigencia,
      });
    });

    return merged;
  };

  const processFiles = async () => {
    setError("");
    if (files.length !== 2) {
      setError("Seleccione ambos archivos: Equivalencias y Precios.");
      return;
    }
    setLoading(true);

    try {
      const workbooks = [];
      for (let file of files) {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: "array" });
        workbooks.push(wb);
      }

      const equivalenciasWS = workbooks[0].Sheets[workbooks[0].SheetNames[0]];
      const preciosWS = workbooks[1].Sheets[workbooks[1].SheetNames[0]];

      const equivalenciasData = XLSX.utils.sheet_to_json(equivalenciasWS, { header: 1 });
      const preciosData = XLSX.utils.sheet_to_json(preciosWS, { header: 1 });

      const merged = mergeExcels(equivalenciasData, preciosData);

      // Filter by vigencia (last 12 months)
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const toWrite = [];
      const skipped = [];
      const outOfVigencia = [];

      for (let product of merged) {
        if (!product.vigencia || product.vigencia < oneYearAgo) {
          outOfVigencia.push(product);
          continue;
        }

        const docRef = doc(db, "products", product.productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const current = docSnap.data();
          // Only write if any parameter changed
          if (
            current.price !== product.price ||
            current.description !== product.description ||
            current.barcode !== product.barcode
          ) {
            toWrite.push(product);
          } else {
            skipped.push(product);
          }
        } else {
          toWrite.push(product);
        }
      }

      setPreview({ toWrite, skipped, outOfVigencia });
    } catch (e) {
      console.error(e);
      setError("Error al procesar los archivos.");
    } finally {
      setLoading(false);
    }
  };

  const writeToFirebase = async () => {
    setLoading(true);
    let writesCount = 0;
    try {
      const batch = writeBatch(db);
      preview.toWrite.forEach((product) => {
        const docRef = doc(db, "products", product.productId);
        batch.set(docRef, {
          description: product.description,
          price: product.price,
          barcode: product.barcode,
          vigencia: product.vigencia,
        });
        writesCount++;
      });
      await batch.commit();
      setFirebaseWrites((prev) => prev + writesCount);
      alert(`Se han escrito ${writesCount} productos en Firebase.`);
      setPreview({ toWrite: [], skipped: [], outOfVigencia: [] });
    } catch (e) {
      console.error(e);
      setError("Error al escribir en Firebase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 space-y-4">
        <h2 className="text-xl font-bold">Importador de Productos</h2>
        <input type="file" multiple onChange={handleFilesChange} accept=".xlsx,.xls" />
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex space-x-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={processFiles}
            disabled={loading}
          >
            Procesar y Previsualizar
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={writeToFirebase}
            disabled={loading || preview.toWrite.length === 0}
          >
            Confirmar Escritura en Firebase
          </button>
        </div>

        {loading && <p>Procesando...</p>}

        <div className="mt-4">
          <p>Productos a escribir: {preview.toWrite.length}</p>
          <p>Productos sin cambios: {preview.skipped.length}</p>
          <p>Productos fuera de vigencia: {preview.outOfVigencia.length}</p>
          <p>Total writes acumuladas: {firebaseWrites}</p>
        </div>

        <div className="overflow-auto max-h-64 mt-4">
          <table className="w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2">Product ID</th>
                <th className="border px-2">Barcode</th>
                <th className="border px-2">Description</th>
                <th className="border px-2">Price</th>
                <th className="border px-2">Vigencia</th>
                <th className="border px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.toWrite.map((p) => (
                <tr key={p.productId}>
                  <td className="border px-2">{p.productId}</td>
                  <td className="border px-2">{p.barcode}</td>
                  <td className="border px-2">{p.description}</td>
                  <td className="border px-2">{p.price}</td>
                  <td className="border px-2">{p.vigencia?.toLocaleDateString()}</td>
                  <td className="border px-2 text-green-600">To Write</td>
                </tr>
              ))}
              {preview.skipped.map((p) => (
                <tr key={p.productId}>
                  <td className="border px-2">{p.productId}</td>
                  <td className="border px-2">{p.barcode}</td>
                  <td className="border px-2">{p.description}</td>
                  <td className="border px-2">{p.price}</td>
                  <td className="border px-2">{p.vigencia?.toLocaleDateString()}</td>
                  <td className="border px-2 text-gray-600">Skipped</td>
                </tr>
              ))}
              {preview.outOfVigencia.map((p) => (
                <tr key={p.productId}>
                  <td className="border px-2">{p.productId}</td>
                  <td className="border px-2">{p.barcode}</td>
                  <td className="border px-2">{p.description}</td>
                  <td className="border px-2">{p.price}</td>
                  <td className="border px-2">{p.vigencia?.toLocaleDateString()}</td>
                  <td className="border px-2 text-red-600">Out of Vigencia</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="mt-4 text-gray-500" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
