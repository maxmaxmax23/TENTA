import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

function Scanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 2,
      focusMode: "continuous",
    });

    scanner.render(
      (result) => {
        scanner.clear();
        onScan(String(result));
      },
      (err) => {
        console.warn(err);
      }
    );
  }, [onScan]);

  return <div id="reader"></div>;
}

export default Scanner;
