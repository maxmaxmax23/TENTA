import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { storage } from "../firebase.js";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function ProductUploaderModal({ sku, matchedItem, onClose }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const storageRef = ref(storage, `products/${sku}.jpg`);
        const downloadUrl = await getDownloadURL(storageRef);
        setUrl(downloadUrl);
      } catch {
        setUrl(null);
      }
    };
    fetchImage();
  }, [sku]);

  const handleUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setUploading(true);

    const storageRef = ref(storage, `products/${sku}.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, selected);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error(error);
        setUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setUrl(downloadUrl);
        setUploading(false);
      }
    );
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-black border border-gold rounded-xl p-6 max-w-sm w-full shadow-xl flex flex-col items-center gap-4 text-gold">
              <Dialog.Title className="text-2xl font-bold">{sku}</Dialog.Title>
              {matchedItem ? (
                <>
                  <p className="font-semibold">{matchedItem.descripcion}</p>
                  <p className="text-gold font-bold">${matchedItem.precio}</p>
                </>
              ) : (
                <p>No hay datos para este SKU.</p>
              )}

              {url ? (
                <img
                  src={url}
                  alt={sku}
                  className="w-32 h-32 object-cover rounded border border-gold"
                />
              ) : (
                <label className="px-4 py-2 bg-gold text-black rounded cursor-pointer hover:bg-yellow-400 transition">
                  {uploading ? "Subiendo..." : "Subir foto"}
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              )}

              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 border border-gold rounded hover:bg-gold hover:text-black transition"
              >
                Escanear otro
              </button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
