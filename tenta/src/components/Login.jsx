import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrecta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-black text-gold p-4">
      <div className="bg-black/90 p-6 rounded-xl w-full max-w-sm flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">Iniciar Sesión</h1>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-md bg-black text-gold border border-gold placeholder-gold focus:outline-none focus:ring-2 focus:ring-gold"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-md bg-black text-gold border border-gold placeholder-gold focus:outline-none focus:ring-2 focus:ring-gold"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-gold text-black font-bold py-3 rounded-full hover:bg-yellow-500 transition-colors duration-200"
          >
            {loading ? "Cargando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
