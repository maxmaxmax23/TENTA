import React from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useState, useEffect } from "react";
import { useZxing } from "react-zxing";

export default function Scanner({ onScan }) {
  const { ref } = useZxing({
    onResult(result) {
      if (result) onScan(result.getText());
    },
    constraints: { facingMode: "environment" },
  });

  return (
    <div style={{ margin: "1rem 0" }}>
      <h2>Scan Product SKU</h2>
      <video ref={ref} style={{ width: "100%" }} />
      <p style={{ fontSize: "0.9rem", color: "#666" }}>
        Point your camera at a barcode or QR code.
      </p>
    </div>
  );
}
