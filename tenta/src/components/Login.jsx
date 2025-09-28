import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center animate-fade-slide-up">
        <h1 className="text-4xl font-bold text-gold mb-6">Bienvenido</h1>

        {error && (
          <p className="text-red-500 mb-4 font-semibold animate-fade-in">{error}</p>
        )}

        <form
          onSubmit={handleLogin}
          className="flex flex-col space-y-4 bg-black/90 p-6 rounded-2xl border-2 border-gold"
        >
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-md border border-gold bg-black text-gold placeholder-gold focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-md border border-gold bg-black text-gold placeholder-gold focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            required
          />
          <button
            type="submit"
            className="py-3 bg-gold text-black font-semibold rounded-md hover:bg-yellow-500 hover:animate-pulse-gold transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
