import { useState } from "react";
import Scanner from "./components/Scanner.jsx";
import ProductUploaderModal from "./components/ProductUploaderModal.jsx";
import Lista from "./tentadb.json"; // Your product database
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Login handler
  const handleLogin = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setUser(res.user);
    } catch (err) {
      setLoginError("Email o contraseña incorrectos");
    }
  };

  // Reset scanner for "Escanear otro"
  const resetScanner = () => {
    setScanResult(null);
  };

  const currentItem = scanResult
    ? Lista.find((item) => item.id === scanResult)
    : null;

  // --- Render ---
  if (!user) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black p-6 text-gold">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          className="w-full max-w-xs p-3 mb-4 rounded-md text-black"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          className="w-full max-w-xs p-3 mb-4 rounded-md text-black"
        />
        <button
          onClick={handleLogin}
          className="bg-gold text-black px-6 py-3 rounded-md font-semibold hover:animate-pulse-gold transition"
        >
          Entrar
        </button>
        {loginError && <p className="text-red-500 mt-3">{loginError}</p>}
      </div>
    );
  }

  // --- Main scanner flow ---
  return (
    <>
      {!scanResult && <Scanner onScan={setScanResult} />}

      {scanResult && (
        <ProductUploaderModal
          code={scanResult}
          item={currentItem}
          onClose={resetScanner}
        />
      )}
    </>
  );
}
