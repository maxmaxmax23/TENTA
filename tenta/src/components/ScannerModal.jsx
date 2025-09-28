import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import ProductUploaderModal from './ProductUploaderModal.jsx';
import Lista from '../tentadb.json';
import { Dialog } from '@headlessui/react';

export default function ScannerModal({ user }) {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (scanResult) return;
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 2,
      focusMode: 'continuous',
    });
    scanner.render(
      result => {
        scanner.clear();
        setScanResult(result);
      },
      err => console.warn(err)
    );
  }, [scanResult]);

  const data = Lista.find(p => p.id === scanResult);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {!scanResult && <div id="reader" />}
      {scanResult && (
        <Dialog open={true} onClose={() => setScanResult(null)}>
          <Dialog.Panel className="modal-panel flex flex-col gap-4">
            <Dialog.Title className="text-xl font-bold">{data?.descripcion || scanResult}</Dialog.Title>
            <p className="text-gold">Precio: ${data?.precio || 'N/A'}</p>
            <ProductUploaderModal sku={scanResult} />
            <button onClick={() => setScanResult(null)}>Escanear otro</button>
          </Dialog.Panel>
        </Dialog>
      )}
    </div>
  );
}
