// src/components/Scanner.jsx
import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scanner({ onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
      rememberLastUsedCamera: true,
    });

    const success = (decodedText) => {
      scanner.clear();
      onScan(decodedText);
    };

    const error = (err) => console.warn(err);

    scanner.render(success, error);

    return () => scanner.clear();
  }, [onScan]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center animate-fade-in bg-black">
      <h2 className="text-gold text-xl mb-4 font-semibold">
        Escanea el SKU o QR
      </h2>
      <div
        id="reader"
        className="w-full max-w-md rounded-md overflow-hidden shadow-lg"
      />
    </div>
  );
}
