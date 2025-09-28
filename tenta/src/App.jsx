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
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black text-gold px-4">
      {!user && (
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
          <Login onLogin={handleLogin} />
        </div>
      )}  

      {scannerVisible && (
      <div className="flex flex-col items-center justify-start min-h-screen w-full pt-6 animate-fade-in">
      <Scanner key={user.uid} />
      </div>
      )}
    </div>
  );
}

export default App;
