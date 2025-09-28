import { useState } from "react";
import { login } from "../firebase";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      onLogin();
    } catch {
      setError("Credenciales inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleSubmit} className="bg-gold p-8 rounded-2xl w-11/12 max-w-sm flex flex-col gap-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center text-black">Iniciar Sesión</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-md border border-black"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-md border border-black"
          required
        />
        <button type="submit" className="bg-black text-gold p-3 rounded-md font-bold hover:bg-gray-800 transition">
          Entrar
        </button>
        {error && <p className="text-red-600 text-center">{error}</p>}
      </form>
    </div>
  );
}
