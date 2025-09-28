import { useState } from 'react';
import Login from './components/Login.jsx';
import ScannerModal from './components/ScannerModal.jsx';
import { auth } from './firebase.js';

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-4">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <ScannerModal user={user} />
      )}
    </div>
  );
}
