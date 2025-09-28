import React, { useState } from 'react';
import { auth } from '../firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-gold p-4">
      <h1 className="text-3xl font-bold mb-6">Bienvenido</h1>
      <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-xs space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="p-3 rounded-lg text-black"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="p-3 rounded-lg text-black"
          required
        />
        <button type="submit" className="bg-gold hover:bg-yellow-400 py-3 rounded-lg font-bold">
          Iniciar sesión
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </form>
    </div>
  );
}
