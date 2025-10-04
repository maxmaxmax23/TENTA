import { useState, useEffect } from "react";
import ImporterModal from "./ImporterModal.jsx";
import BackupManager from "./BackupManager.jsx";
import JsonSyncModal from "./JsonSyncModal.jsx";
import ProductCard from "./ProductCard.jsx";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase.js";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [showImporter, setShowImporter] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [status, setStatus] = useState("Cargando productos...");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "products"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
        setStatus(`Productos cargados: ${items.length}`);
      } catch (err) {
        console.error("Error loading products:", err);
        setStatus("Error cargando productos");
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📦 Dashboard de Productos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImporter(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Importar Excel
          </button>
          <button
            onClick={() => setShowSync(true)}
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            Sincronizar JSON
          </button>
        </div>
      </header>

      <BackupManager />

      <p className="mt-4 text-gray-700">{status}</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {showImporter && <ImporterModal onClose={() => setShowImporter(false)} />}
      {showSync && <JsonSyncModal onClose={() => setShowSync(false)} />}
    </div>
  );
}
