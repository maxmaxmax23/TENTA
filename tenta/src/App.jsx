import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./components/ProductUploaderModal.jsx";
import Lista from "./tentadb.json";

export default function App() {
  const [scanResult, setScanResult] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    if (!scanResult) {
      const scanner = new Html5QrcodeScanner("reader", {
        qrbox: { width: 250, height: 250 },
        fps: 10,
        aspectRatio: 1,
        focusMode: "continuous",
      });

      scanner.render(
        (result) => {
          scanner.clear();
          const item = Lista.find((i) => i.id === result);
          setScanResult(result);
          setCurrentItem(item || { id: result });
        },
        (err) => console.warn(err)
      );
    }
  }, [scanResult]);

  const handleUpdate = (updatedItem) => {
    // This updates the local state for rendering the new image
    setCurrentItem({ ...updatedItem });
    // TODO: Persist to DB or Firestore here
  };

  return (
    <div className="w-full min-h-screen bg-black text-gold p-4 flex flex-col items-center justify-start">
      {!scanResult && <div id="reader" className="w-full max-w-md mx-auto my-4" />}
      
      {scanResult && currentItem && (
        <div className="w-full max-w-md bg-black/90 rounded-xl p-4 mt-4 flex flex-col gap-4 animate-fadeIn">
          <h2 className="text-xl font-bold">{currentItem.descripcion || currentItem.id}</h2>
          {currentItem.precio && <p className="text-lg">Precio: ${currentItem.precio}</p>}

          {currentItem.imageUrl ? (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.descripcion}
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <button
              className="bg-gold text-black py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
              onClick={() => setShowUploader(true)}
            >
              Subir Foto
            </button>
          )}

          <button
            className="mt-2 border border-gold text-gold py-2 rounded-full hover:bg-gold hover:text-black transition-colors"
            onClick={() => setScanResult(null)}
          >
            Escanear Otro
          </button>

          {currentItem.imageUrl && (
            <button
              className="mt-2 bg-gold text-black py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
              onClick={() => setShowUploader(true)}
            >
              Actualizar Foto
            </button>
          )}
        </div>
      )}

      {showUploader && currentItem && (
        <ProductUploaderModal
          item={currentItem}
          onClose={() => setShowUploader(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
