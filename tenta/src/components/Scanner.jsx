import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Scanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(result => {
      scanner.clear();
      onScan(result);
    }, err => {
      console.warn(err);
    });

    return () => scanner.clear();
  }, []);

  return <div id="reader" className="w-full h-[60vh] mb-4"></div>;
}
