import { useState } from 'react';
import Login from './components/Login.jsx';
import Scanner from './components/Scanner.jsx';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // Logged-in user
  const [scannerVisible, setScannerVisible] = useState(false);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setScannerVisible(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gold px-4">
      {!user && <Login onLogin={handleLogin} />}
      
      {scannerVisible && (
        <div className="w-full max-w-md mt-4 animate-fade-in">
          <Scanner />
        </div>
      )}
    </div>
  );
}

export default App;
