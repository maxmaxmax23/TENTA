import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import ProductUploaderModal from './ProductUploaderModal.jsx';
import Lista from '../tentadb.json';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function ScannerModal() {
  const [scanResult, setScanResult] = useState(null);
  const [scannerReady, setScannerReady] = useState(true);

  useEffect(() => {
    if (!scannerReady || scanResult) return;

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

    return () => scanner.clear();
  }, [scannerReady, scanResult]);

  const data = Lista.find(p => p.id === scanResult);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {scannerReady && !scanResult && <div id="reader" className="animate-fade-in" />}
      
      <Transition appear show={!!scanResult} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setScanResult(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300 transform"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200 transform"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="modal-panel flex flex-col gap-4">
                <Dialog.Title className="text-xl font-bold">{data?.descripcion || scanResult}</Dialog.Title>
                <p className="text-gold">Precio: ${data?.precio || 'N/A'}</p>
                <ProductUploaderModal sku={scanResult} />
                <button
                  onClick={() => {
                    setScanResult(null);
                    setScannerReady(true);
                  }}
                >
                  Escanear otro
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
