import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full bg-black text-yellow-400 px-4">
      <h2 className="text-3xl font-bold mb-6">Login</h2>
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded-lg bg-gray-900 text-white placeholder-yellow-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded-lg bg-gray-900 text-white placeholder-yellow-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="p-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition"
        >
          Entrar
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}

export default Login;
