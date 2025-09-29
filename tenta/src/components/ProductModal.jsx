import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import ProductUploaderModal from "./ProductUploaderModal.jsx";

export default function ProductModal({ code, onClose }) {
  const [product, setProduct] = useState(null);
  const [openUploader, setOpenUploader] = useState(false);

  const fetchProduct = async () => {
    const docRef = doc(db, "products", code);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) setProduct(snapshot.data());
    else setProduct(null);
  };

  useEffect(() => {
    fetchProduct();
  }, [code]);

  const handleUploadClose = () => {
    setOpenUploader(false);
    fetchProduct(); // refresh product with new image
  };

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-center p-6">
      {product ? (
        <div className="w-full max-w-sm bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{product.descripcion}</h2>
          <p className="text-lg mb-4">Precio: ${product.precio}</p>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.descripcion}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          ) : (
            <p className="text-sm mb-4">No hay imagen, sube una ahora.</p>
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
        </div>
      ) : (
        <p>No se encontró información para {code}.</p>
      )}

      {openUploader && (
        <ProductUploaderModal code={code} onClose={handleUploadClose} />
      )}
    </div>
  );
}
