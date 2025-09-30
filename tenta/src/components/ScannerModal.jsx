import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerModal({ onScan }) {
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (result) => {
        if (!hasScanned) {
          setHasScanned(true);
          scanner.clear();
          onScan(result);
        }
      },
      (err) => console.warn(err)
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [hasScanned, onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold mb-4">Escanea un código</h2>
      <div id="reader" className="w-80 h-80 border border-gold rounded-lg"></div>
    </div>
  );
}
