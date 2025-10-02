// File: src/components/ProductModal.jsx
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import ProductUploaderModal from "./ProductUploaderModal.jsx";

export default function ProductModal({ code, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openUploader, setOpenUploader] = useState(false);
  const [log, setLog] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const snapshot = await getDoc(doc(db, "products", code));
        if (snapshot.exists()) {
          setProduct(snapshot.data());
          setLog("✅ Producto cargado correctamente");
        } else {
          setProduct(null);
          setLog(`❌ Producto no encontrado: ${code}`);
        }
      } catch (err) {
        console.error(err);
        setLog("⚠ Error al cargar producto");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [code]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4">
        <p className="text-gold">Cargando producto...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4 space-y-4">
      {product ? (
        <div className="w-full max-w-sm bg-gray-900 p-6 rounded-xl shadow-lg text-gold space-y-4">
          <h2 className="text-2xl font-bold">{product.descripcion}</h2>
          <p className="text-lg">Precio: ${product.precio}</p>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.descripcion}
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <p className="text-sm">No hay imagen. Puedes subir una.</p>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => setOpenUploader(true)}
              className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
            >
              {product.imageUrl ? "Reemplazar Imagen" : "Subir Imagen"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
            >
              Escanear Otro
            </button>
          </div>
          {log && <p className="text-sm">{log}</p>}
        </div>
      ) : (
        <div className="w-full max-w-sm bg-gray-900 p-6 rounded-xl shadow-lg text-gold text-center">
          <p>{log}</p>
          <button
            onClick={onClose}
            className="mt-4 py-2 px-4 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Volver
          </button>
        </div>
      )}

      {openUploader && (
        <ProductUploaderModal code={code} onClose={() => setOpenUploader(false)} />
      )}
    </div>
  );
}
