import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true); // trigger animation on mount
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
    <div
      className={`w-full max-w-sm flex flex-col gap-4 p-6 modal-panel ${animate ? 'animate-fade-slide-up' : ''}`}
    >
      <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="text-red-500 text-center">{error}</p>}
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
