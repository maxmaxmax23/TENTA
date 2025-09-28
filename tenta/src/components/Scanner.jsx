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
    <div className="w-full h-screen flex flex-col items-center justify-center scanner-box">
      <div id="reader" className="w-full h-3/4 max-h-[500px]"></div>
      <p className="text-gold mt-4 text-lg text-center">Escanea un código o QR</p>
    </div>
  );
}
