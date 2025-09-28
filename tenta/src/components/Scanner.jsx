import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (result) => {
        scanner.clear();
        onScan(result);
      },
      (err) => console.warn(err)
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div
      id="reader"
      className="w-full max-w-xs h-80 border border-gold rounded-lg"
    ></div>
  );
}
