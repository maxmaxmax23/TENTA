import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-black text-gold p-6">
      <h1 className="text-2xl mb-6 font-bold">Iniciar Sesión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-lg bg-black/80 border border-gold text-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-lg bg-black/80 border border-gold text-white"
          required
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="bg-gold text-black py-3 rounded-lg font-bold hover:opacity-80 transition">
          Login
        </button>
      </form>
    </div>
  );
}
