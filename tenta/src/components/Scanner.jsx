import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Lista from '../tentadb.json';
import ProductUploaderModal from './ProductUploaderModal.jsx';

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
      },
      (err) => console.warn(err)
    );

    return () => scanner.clear(); // cleanup
  }, []);

  return (
    <div className="flex flex-col items-center">
      {!scanResult && <div id="reader" className="w-full max-w-md h-64 bg-black rounded-lg"></div>}

      {scanResult && (
        <ProductUploaderModal code={scanResult} onReset={() => setScanResult(null)} />
      )}
    </div>
  );
}
