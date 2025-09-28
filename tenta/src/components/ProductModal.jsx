import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import tentadb from "./tentadb.json";

function ProductModal({ code, onClose }) {
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const product = tentadb.find((item) => item.id === code);

  useEffect(() => {
    async function fetchImage() {
      try {
        const docRef = doc(db, "products", code);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.imageUrl) {
            setImageUrl(data.imageUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching image:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchImage();
  }, [code]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `products/${code}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Save URL to Firestore
      await setDoc(
        doc(db, "products", code),
        { imageUrl: url },
        { merge: true }
      );

      setImageUrl(url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="modal-backdrop">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="modal-container space-y-4 text-center"
        >
          <h2 className="text-lg font-semibold">Código no encontrado</h2>
          <button onClick={onClose} className="btn btn-secondary w-full">
            Escanear otro
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="modal-backdrop">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 120 }}
          className="modal-container space-y-6"
        >
          <h2 className="text-xl font-display font-bold">{product.descripcion}</h2>
          <p className="text-md">Precio: ${product.precio}</p>
          <p className="text-sm opacity-80">{product.listadesc}</p>

          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Producto"
                  className="w-32 h-32 object-cover rounded-lg border border-gold"
                />
              ) : (
                <p className="text-sm">No hay imagen cargada</p>
              )}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="text-sm"
              />
            </div>
          )}

          <button onClick={onClose} className="btn btn-secondary w-full">
            Escanear otro
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProductModal;
