import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import Lista from "./tentadb.json";
import ProductUploaderModal from "./components/ProductUploaderModal.jsx";
import { Popover } from "@headlessui/react";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [scanResult, setScanResult] = useState(null);
  const [showScanner, setShowScanner] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleLogin = async () => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      setUser(user);
    } catch (err) {
      alert("Error al iniciar sesión: " + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setScanResult(null);
    setShowScanner(true);
  };

  useEffect(() => {
    if (!showScanner || !user) return;

    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
      focusMode: "continuous",
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
        const product = Lista.find((p) => p.id === result);
        setSelectedProduct(product || null);
        setShowScanner(false);
      },
      (err) => console.warn(err)
    );

    return () => scanner.clear();
  }, [showScanner, user]);

  if (!user) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black p-6">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">TENTA Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 px-4 py-3 rounded-lg w-full max-w-xs text-black"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 px-4 py-3 rounded-lg w-full max-w-xs text-black"
        />
        <button
          onClick={handleLogin}
          className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold text-lg w-full max-w-xs"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black text-yellow-400 flex flex-col items-center p-4">
      <div className="w-full flex justify-between mb-4">
        <h2 className="text-xl font-bold">Bienvenido, {user.email}</h2>
        <button
          onClick={handleLogout}
          className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold"
        >
          Salir
        </button>
      </div>

      {showScanner ? (
        <div id="reader" className="w-full max-w-md h-96" />
      ) : selectedProduct ? (
        <div className="w-full max-w-md">
          <Popover className="relative">
            <Popover.Button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold mb-4 w-full">
              {scanResult}
            </Popover.Button>
            <Popover.Panel className="absolute z-10 bg-black p-4 rounded-lg mt-2 w-full">
              <div className="mb-2 text-lg font-semibold">
                {selectedProduct ? `$${selectedProduct.precio}` : "No hay precio"}
              </div>
              <div className="mb-4">
                {selectedProduct ? selectedProduct.descripcion : "Consultar en CAJA"}
              </div>

              <ProductUploaderModal sku={scanResult} />

              <button
                className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold w-full"
                onClick={() => {
                  setScanResult(null);
                  setSelectedProduct(null);
                  setShowScanner(true);
                }}
              >
                Escanear otro
              </button>
            </Popover.Panel>
          </Popover>
        </div>
      ) : (
        <div className="text-lg mt-4">Cargando...</div>
      )}
    </div>
  );
}
