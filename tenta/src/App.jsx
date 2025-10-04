export default function App() {
  const [user, setUser] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showMerger, setShowMerger] = useState(false);
  const [firebaseWrites, setFirebaseWrites] = useState(0);
  const [mergedDataQueue, setMergedDataQueue] = useState([]); // NEW: queue of merged products

  const incrementWrites = (count) => setFirebaseWrites((prev) => prev + count);

  return (
    <div className="min-h-screen bg-black text-gold flex items-center justify-center">
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : scannedCode ? (
        <ProductModal code={scannedCode} onClose={() => setScannedCode(null)} />
      ) : (
        <>
          <Dashboard
            onScan={(code) => setScannedCode(code)}
            onOpenImporter={() => setShowImporter(true)}
            onOpenMerger={() => setShowMerger(true)}
            firebaseWrites={firebaseWrites}
          />

          {showMerger && (
            <MergerModal
              onClose={() => setShowMerger(false)}
              setMergedDataQueue={setMergedDataQueue} // NEW
            />
          )}

          {showImporter && (
            <ImporterModal
              onClose={() => setShowImporter(false)}
              incrementWrites={incrementWrites}
              mergedDataQueue={mergedDataQueue} // NEW: pass the queue
              clearQueue={() => setMergedDataQueue([])} // NEW: clear after import
            />
          )}
        </>
      )}
    </div>
  );
}
