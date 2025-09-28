import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import ProductUploaderModal from './ProductUploaderModal.jsx';
import tentadb from './tentadb.json';

export default function Scanner({ user }) {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', { qrbox: 250, fps: 10 });
    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
      },
      (err) => console.warn(err)
    );
  }, []);

  const product = tentadb.find((item) => item.id === scanResult);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start pt-10">
      {!scanResult ? (
        <div id="reader" className="w-11/12 max-w-md rounded-xl overflow-hidden"></div>
      ) : (
        <ProductUploaderModal product={product} onClose={() => setScanResult(null)} />
      )}
    </div>
  );
}
