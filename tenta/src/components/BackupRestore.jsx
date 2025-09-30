<div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
  <h2 className="text-lg font-bold mb-4">Restaurar Backup</h2>

  {loading && (
    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
      <div
        className="bg-gold h-4 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  )}

  {!loading && (
    <>
      {backups.length === 0 ? (
        <p>No hay backups disponibles.</p>
      ) : (
        <select
          className="w-full mb-4 border px-2 py-1 rounded"
          onChange={(e) =>
            setSelectedBackup(backups.find((b) => b.id === e.target.value))
          }
        >
          <option value="">Selecciona un backup</option>
          {backups.map((b) => (
            <option key={b.id} value={b.id}>
              {new Date(b.timestamp).toLocaleString()}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={restoreBackup}
        disabled={!selectedBackup}
        className="w-full py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50"
      >
        Restaurar
      </button>

      <button
        onClick={onClose}
        className="mt-4 w-full py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancelar
      </button>
    </>
  )}
</div>
