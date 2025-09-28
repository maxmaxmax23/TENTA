import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      setError('Login failed');
      console.error(err);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full max-w-sm mx-auto p-6 gap-4 animate-fade-slide-up`}>
      <h1 className="text-3xl font-bold mb-6 text-center">Iniciar Sesión</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-3 rounded-md text-black"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full p-3 rounded-md text-black"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={handleLogin}
        className="w-full bg-gold text-black py-3 rounded-md font-semibold hover:bg-yellow-500 transition-colors"
      >
        Entrar
      </button>
    </div>
  );
}
