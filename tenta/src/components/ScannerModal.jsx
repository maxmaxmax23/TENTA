import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerModal({ setScanResult }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
      disableFlip: false,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
      },
      (err) => {
        console.warn(err);
      }
    );

    return () => scanner.clear();
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fadeIn">
      <div id="reader" className="w-80 h-80 border-4 border-gold rounded-xl" />
      <p className="mt-4 text-gold font-semibold">Scan SKU or QR Code</p>
    </div>
  );
}
