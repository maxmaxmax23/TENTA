import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerModal({ setScannedCode }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1,
      disableFlip: false,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScannedCode(result);
      },
      (err) => console.warn(err)
    );
  }, [setScannedCode]);

  return (
    <div
      id="reader"
      className="w-full h-screen flex items-center justify-center bg-black"
    ></div>
  );
}
