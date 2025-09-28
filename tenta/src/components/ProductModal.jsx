import { useState } from "react";
import { motion } from "framer-motion";
import { uploadImageAndUpdateProduct } from "../firebase.js";

export default function ProductModal({ product, onClose }) {
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    if (!e.target.files[0]) return;
    setLoading(true);
    const file = e.target.files[0];
    const url = await uploadImageAndUpdateProduct(product.id, file);
    setImageUrl(url);
    setLoading(false);
  };

  if (!product) return <div>No data for this SKU</div>;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-end justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // close if background clicked
    >
      <motion.div
        className="bg-black text-gold rounded-t-2xl w-full max-w-md p-6 shadow-xl flex flex-col gap-4"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 300 }}
        dragElastic={0.2}
        onDragEnd={(event, info) => {
          if (info.point.y > 200) onClose(); // swipe down to close
        }}
        onClick={(e) => e.stopPropagation()} // prevent background click
      >
        <h2 className="text-xl font-bold text-center">{product.descripcion}</h2>
        <p className="text-center">ID: {product.id}</p>
        <p className="text-center">Precio: ${product.precio || "N/A"}</p>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.descripcion}
            className="w-full h-48 object-cover rounded-md"
          />
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="w-full p-2 border border-gold rounded-md text-black"
            />
            {loading && <p className="text-center mt-2">Cargando...</p>}
          </>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full p-3 bg-gold text-black rounded-md font-bold hover:bg-yellow-500 transition"
        >
          Escanear Otro
        </button>
      </motion.div>
    </motion.div>
  );
}
