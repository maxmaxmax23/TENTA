import { useState } from 'react';
import LoginForm from './LoginForm.jsx';
import Scanner from './Scanner.jsx';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col justify-center items-center">
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : (
        <Scanner user={user} />
      )}
    </div>
  );
}

export default App;
