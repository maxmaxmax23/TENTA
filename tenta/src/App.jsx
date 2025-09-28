// src/App.jsx
import { useState } from "react";
import Scanner from "./components/Scanner.jsx";
import ProductUploaderModal from "./components/ProductUploaderModal.jsx";
import Lista from "./tentadb.json";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const handleLogin = async () => {
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        import.meta.env.VITE_LOGIN_EMAIL,
        import.meta.env.VITE_LOGIN_PASSWORD
      );
      setUser(user);
    } catch (err) {
      alert("Error al iniciar sesión");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setScanResult(null);
  };

  const handleScan = (code) => {
    setScanResult(code);
  };

  const closeModal = () => setScanResult(null);

  if (!user) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black p-6">
        <h1 className="text-2xl font-bold text-gold mb-6">TENTA Login</h1>
        <button
          onClick={handleLogin}
          className="bg-gold text-black px-6 py-3 rounded-lg font-semibold text-lg"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black text-gold">
      <div className="p-4 flex justify-between items-center">
        <h2 className="font-bold text-xl">TENTA Scanner</h2>
        <button
          onClick={handleLogout}
          className="bg-gold text-black px-3 py-1 rounded-md font-semibold"
        >
          Salir
        </button>
      </div>

      {!scanResult && <Scanner onScan={handleScan} />}
      {scanResult && (
        <ProductUploaderModal
          code={scanResult}
          item={Lista.find((i) => i.id === scanResult)}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
