import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase.js';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

export default function ImporterModal({ onClose }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [status, setStatus] = useState('');

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'equivalencias') setEquivalenciasFile(file);
    if (type === 'precios') setPreciosFile(file);
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        resolve(json);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const normalizeDate = (str) => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  };

  const normalizePrice = (str) => {
    if (!str) return 0;
    return parseFloat(str.toString().replace('.', '').replace(',', '.')) || 0;
  };

  const processFiles = async () => {
    if (!equivalenciasFile || !preciosFile) {
      alert('Please select both files');
      return;
    }

    setStatus('Procesando...');

    try {
      const eqData = await parseExcel(equivalenciasFile);
      const prData = await parseExcel(preciosFile);

      // Skip headers
      const eqRows = eqData.slice(1);
      const prRows = prData.slice(1);

      const eqMap = {};
      eqRows.forEach(([barcode, productId, desc]) => {
        if (!eqMap[productId]) eqMap[productId] = { barcodes: [] };
        eqMap[productId].barcodes.push(barcode);
      });

      const preview = [];

      for (const row of prRows) {
        const [productId, , , , vigencia, precio] = row;
        const vigDate = normalizeDate(vigencia);
        const normPrice = normalizePrice(precio);
        const barcodes = eqMap[productId]?.barcodes || [];

        // Check vigencia
        const today = new Date();
        const vigObj = vigDate ? new Date(vigDate) : null;
        const outOfVigencia = vigObj ? vigObj < today : true;

        preview.push({ productId, barcodes, price: normPrice, vigencia: vigDate, outOfVigencia });
      }

      setPreviewData(preview);
      setStatus('Preview listo');
    } catch (err) {
      console.error(err);
      setStatus('Error al procesar los archivos');
    }
  };

  const writeToFirebase = async () => {
    setStatus('Escribiendo en Firebase...');
    const colRef = collection(db, 'products');

    for (const item of previewData) {
      if (item.outOfVigencia) continue;
      const docRef = doc(colRef, item.productId);
      const docSnap = await getDoc(docRef);

      let needsUpdate = true;
      if (docSnap.exists()) {
        const data = docSnap.data();
        needsUpdate = (
          JSON.stringify(data.barcodes || []) !== JSON.stringify(item.barcodes) ||
          data.price !== item.price ||
          data.vigencia !== item.vigencia
        );
      }

      if (needsUpdate) {
        await setDoc(docRef, {
          barcodes: item.barcodes,
          price: item.price,
          vigencia: item.vigencia
        });
      }
    }

    setStatus('Importación completada');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-4/5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Importador</h2>

        <div className="mb-4">
          <label>Equivalencias:</label>
          <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, 'equivalencias')} />
        </div>

        <div className="mb-4">
          <label>Precios:</label>
          <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, 'precios')} />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded mr-2" onClick={processFiles}>Procesar y Previsualizar</button>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={writeToFirebase}>Escribir en Firebase</button>
        <button className="bg-gray-400 text-white px-4 py-2 rounded ml-2" onClick={onClose}>Cerrar</button>

        <p className="mt-4">{status}</p>

        {previewData.length > 0 && (
          <table className="mt-4 w-full border">
            <thead>
              <tr>
                <th>Producto ID</th>
                <th>Barcodes</th>
                <th>Price</th>
                <th>Vigencia</th>
                <th>Out of Vigencia</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((item, idx) => (
                <tr key={idx} className={item.outOfVigencia ? 'bg-red-200' : ''}>
                  <td>{item.productId}</td>
                  <td>{item.barcodes.join(', ')}</td>
                  <td>{item.price}</td>
                  <td>{item.vigencia}</td>
                  <td>{item.outOfVigencia ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
