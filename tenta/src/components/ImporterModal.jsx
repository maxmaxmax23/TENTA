import { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js"; // Firebase initialized elsewhere
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";

export default function ImporterModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [counters, setCounters] = useState({
    toBeWritten: 0,
    changed: 0,
    skipped: 0,
    outOfVigencia: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setPreview([]);
    setErrorLog([]);
    setCounters({
      toBeWritten: 0,
      changed: 0,
      skipped: 0,
      outOfVigencia: 0,
    });
  };

  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    // Accept DD/MM/YY or DD/MM/YYYY
    const parts = dateString.split("/");
    if (parts.length !== 3) return null;
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // JS months 0-11
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000; // e.g., 23 => 2023
    return new Date(year, month, day);
  };

  const processFiles = async () => {
    if (files.length !== 2) {
      setErrorLog(["Debe seleccionar exactamente 2 archivos: Equivalencias y Precios"]);
      return;
    }

    setLoading(true);
    setPreview([]);
    setErrorLog([]);

    try {
      const [equivFile, preciosFile] = files;

      // Read files
      const equivData = XLSX.read(await equivFile.arrayBuffer(), { type: "array" });
      const preciosData = XLSX.read(await preciosFile.arrayBuffer(), { type: "array" });

      const equivSheet = XLSX.utils.sheet_to_json(equivData.Sheets[equivData.SheetNames[0]], {
        header: 1,
        raw: false,
      });
      const preciosSheet = XLSX.utils.sheet_to_json(preciosData.Sheets[preciosData.SheetNames[0]], {
        header: 1,
        raw: false,
      });

      const mergedProducts = [];

      // Map equivalencias: barcode -> productId
      const barcodeMap = {};
      for (let i = 1; i < equivSheet.length; i++) {
        const row = equivSheet[i];
        const [barcode, productId] = row;
        if (barcode && productId) {
          barcodeMap[productId] = barcodeMap[productId] || [];
          barcodeMap[productId].push(barcode);
        }
      }

      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      let toBeWritten = 0,
        changed = 0,
        skipped = 0,
        outOfVigencia = 0;

      for (let i = 1; i < preciosSheet.length; i++) {
        const row = preciosSheet[i];
        const [productId, , , , vigenciaStr, priceStr] = row;

        const vigenciaDate = normalizeDate(vigenciaStr);
        if (!vigenciaDate) {
          outOfVigencia++;
          mergedProducts.push({ productId, status: "fuera de vigencia" });
          continue;
        }

        if (vigenciaDate < oneYearAgo) {
          outOfVigencia++;
          mergedProducts.push({ productId, status: "fuera de vigencia" });
          continue;
        }

        const barcodes = barcodeMap[productId] || [];
        const price = parseFloat(priceStr.replace(/\./g, "").replace(",", "."));

        mergedProducts.push({
          productId,
          barcodes,
          price,
          vigencia: vigenciaDate.toISOString().split("T")[0],
          status: "toBeWritten",
        });
        toBeWritten++;
      }

      setPreview(mergedProducts);
      setCounters({ toBeWritten, changed, skipped, outOfVigencia });
    } catch (err) {
      console.error(err);
      setErrorLog([err.message || "Error al procesar los archivos"]);
    } finally {
      setLoading(false);
    }
  };

  const writeToFirebase = async () => {
    setLoading(true);
    const batchErrors = [];
    try {
      for (const product of preview.filter((p) => p.status === "toBeWritten")) {
        try {
          const docRef = doc(db, "products", product.productId);
          const docSnap = await getDoc(docRef);
          let writeRequired = true;
          if (docSnap.exists()) {
            const existing = docSnap.data();
            // Only write if price or barcodes changed
            writeRequired =
              existing.price !== product.price ||
              JSON.stringify(existing.barcodes || []) !== JSON.stringify(product.barcodes);
          }

          if (writeRequired) {
            await setDoc(docRef, product);
            changed++;
          }
        } catch (err) {
          batchErrors.push({ productId: product.productId, error: err.message });
        }
      }
      alert(`Importación completada con ${changed} cambios.`);
    } catch (err) {
      console.error(err);
      alert("Error escribiendo a Firebase: " + err.message);
    } finally {
      setLoading(false);
      if (batchErrors.length > 0) {
        setErrorLog(batchErrors.map((e) => `${e.productId}: ${e.error}`));
      }
    }
  };

  return (
    <div className="importer-modal">
      <h2>Importar Productos</h2>
      <input type="file" onChange={handleFileChange} multiple />
      <button onClick={processFiles} disabled={loading}>
        {loading ? "Procesando..." : "Procesar y Previsualizar"}
      </button>
      <button onClick={writeToFirebase} disabled={loading || preview.length === 0}>
        Escribir en Firebase
      </button>

      <div className="counters">
        <p>Para escribir: {counters.toBeWritten}</p>
        <p>Cambiados: {counters.changed}</p>
        <p>Omitidos: {counters.skipped}</p>
        <p>Fuera de vigencia: {counters.outOfVigencia}</p>
      </div>

      {errorLog.length > 0 && (
        <div className="errors">
          <h3>Errores</h3>
          {errorLog.map((e, idx) => (
            <p key={idx}>{e}</p>
          ))}
        </div>
      )}

      <div className="preview-table">
        <h3>Previsualización</h3>
        <table>
          <thead>
            <tr>
              <th>Producto ID</th>
              <th>Barcodes</th>
              <th>Precio</th>
              <th>Vigencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p, idx) => (
              <tr key={idx}>
                <td>{p.productId}</td>
                <td>{(p.barcodes || []).join(", ")}</td>
                <td>{p.price}</td>
                <td>{p.vigencia || "-"}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}
