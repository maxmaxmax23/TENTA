import { useState } from "react";
import * as XLSX from "xlsx";

export default function ExcelMerger({ onMerge }) {
  const [status, setStatus] = useState(null);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length < 2) {
      setStatus("Please select both equivalencia and precios files.");
      return;
    }

    try {
      const [equivFile, precioFile] = files;

      const readExcel = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
              defval: "",
            });
            resolve(sheet);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsArrayBuffer(file);
        });

      const equivalencias = await readExcel(equivFile);
      const precios = await readExcel(precioFile);

      // Merge by "Artículo"
      const merged = equivalencias.map((eq) => {
        const priceRow = precios.find((p) => p.Artículo === eq.Artículo);
        return {
          id: eq.Artículo,
          barcodes: [eq.Código].filter(Boolean),
          description: eq.Descripción,
          price: priceRow ? Number(priceRow.Precio) || 0 : 0,
          vigencia: priceRow ? priceRow.Vigencia : null,
        };
      });

      onMerge(merged);
      setStatus(`Merged ${merged.length} products.`);
    } catch (err) {
      console.error("Error processing files:", err);
      setStatus("Error processing files. Check console for details.");
    }
  };

  return (
    <div>
      <input type="file" multiple accept=".xls,.xlsx" onChange={handleFileChange} />
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
