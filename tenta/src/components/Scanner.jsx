// src/components/Scanner.jsx
import React from "react";
import { useZxing } from "react-zxing";

export default function Scanner({ onScan }) {
  const { ref } = useZxing({
    onResult(result) {
      if (result) onScan(result.getText());
    },
    constraints: { facingMode: "environment" }, // back camera
  });

  return (
    <div style={{ width: "100%", height: "300px", position: "relative" }}>
      <video
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "8px",
          backgroundColor: "#000",
        }}
        autoPlay
        muted
      />
      <p
        style={{
          position: "absolute",
          bottom: "8px",
          width: "100%",
          textAlign: "center",
          color: "#fff",
          fontSize: "0.9rem",
        }}
      >
        Point your camera at a barcode or QR code
      </p>
    </div>
  );
}
