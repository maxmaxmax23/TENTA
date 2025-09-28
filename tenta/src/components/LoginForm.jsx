// src/components/LoginForm.jsx
import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { motion } from "framer-motion";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCred.user);
    } catch (err) {
      setError("Credenciales inválidas. Inténtalo de nuevo.");
    }
  };

  return (
    <motion.div
      className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-black to-gray-900 text-gold-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-sm p-6 bg-black rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-yellow-400 mb-6">
          Inicia Sesión
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-600 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </motion.div>
  );
}
