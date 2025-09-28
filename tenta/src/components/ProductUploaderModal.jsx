import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Lista from './tentadb.json';

export default function ProductUploaderModal({ user, selectedProduct, setSelectedProduct }) {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
      },
      (err) => console.warn(err)
    );
  }, []);

  const product = scanResult ? Lista.find((item) => item.id === scanResult) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 w-full">
      {!scanResult && <div id="reader" className="w-full max-w-xs"></div>}

      {scanResult && product && (
        <div className="bg-gray-900 text-gold rounded-xl p-4 w-full max-w-xs mt-4 flex flex-col gap-2 items-center">
          <h2 className="text-xl font-bold">{product.descripcion}</h2>
          <p>Precio: ${product.precio}</p>
          <p>ID: {product.id}</p>
          <button
            onClick={() => setScanResult(null)}
            className="bg-gold text-black p-2 rounded mt-2 w-full font-bold hover:bg-yellow-500 transition"
          >
            Escanear otro
          </button>
        </div>
      )}
    </div>
  );
}
