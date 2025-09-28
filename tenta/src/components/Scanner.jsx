import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1
    });

    scanner.render(
      (result) => {
        scanner.clear();
        onScan(result);
      },
      (err) => console.warn(err)
    );

    return () => scanner.clear();
  }, []);

  return (
    <div className="w-full flex flex-col items-center scanner-box">
      <div id="reader" className="w-full h-64"></div>
      <p className="text-gold mt-2 text-center text-lg">Escanea un código o QR</p>
    </div>
  );
}
