import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export default function ProductUploader({ codigo, info }) {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (codigo) {
      const storageRef = ref(storage, `images/${codigo}`);
      getDownloadURL(storageRef)
        .then((url) => setImageUrl(url))
        .catch(() => setImageUrl(null));
    }
  }, [codigo]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const storageRef = ref(storage, `images/${codigo}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImageUrl(url);
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded shadow-md w-full max-w-md mt-4 flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">CODIGO: {codigo}</h2>
      {info ? (
        <div className="text-center">
          <p className="font-medium">Descripción: {info.descripcion}</p>
          <p className="font-medium">Precio: ${info.precio}</p>
        </div>
      ) : (
        <p>No hay datos para este código</p>
      )}

      {imageUrl ? (
        <img src={imageUrl} alt="SKU" className="w-32 h-32 object-cover rounded" />
      ) : (
        <>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
          >
            {loading ? "Uploading..." : "Upload Image"}
          </button>
        </>
      )}
    </div>
  );
}
