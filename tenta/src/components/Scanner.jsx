import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(
      (result) => {
        scanner.clear();
        onScan(result);
      },
      (err) => console.warn(err)
    );
  }, [onScan]);

  return (
    <div className="w-full flex justify-center items-center">
      <div id="reader" className="w-full max-w-md h-80 rounded-lg overflow-hidden" />
    </div>
  );
}
