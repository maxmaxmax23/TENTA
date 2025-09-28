import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen animate-fade-in p-4">
      <h1 className="text-4xl font-bold text-gold mb-6">Iniciar Sesión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-lg border border-gold bg-black-lux text-gold placeholder-gold focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-lg border border-gold bg-black-lux text-gold placeholder-gold focus:outline-none focus:ring-2 focus:ring-gold"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
