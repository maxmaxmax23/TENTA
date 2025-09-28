import { useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import ScannerModal from './components/ScannerModal.jsx';
import ProductUploaderModal from './components/ProductUploaderModal.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);

  return (
    <div className="w-full min-h-screen bg-black text-gold flex flex-col items-center justify-center">
      {!user && <LoginForm setUser={setUser} />}
      {user && !scannedCode && (
        <ScannerModal setScannedCode={setScannedCode} />
      )}
      {user && scannedCode && (
        <ProductUploaderModal
          scannedCode={scannedCode}
          resetScanner={() => setScannedCode(null)}
        />
      )}
    </div>
  );
}

export default App;
