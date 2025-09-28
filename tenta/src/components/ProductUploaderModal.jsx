import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { storage } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProductUploaderModal({ code, data, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `products/${code}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
    setUploading(false);
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-400"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-400"
            enterFrom="opacity-0 scale-95 -translate-y-6"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-300"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 -translate-y-6"
          >
            <Dialog.Panel className="w-full max-w-md bg-black border border-gold rounded-2xl p-6 text-gold shadow-xl">
              <Dialog.Title className="text-xl font-bold mb-4">
                {data?.descripcion || `Producto ${code}`}
              </Dialog.Title>
              <p className="mb-4">Precio: ${data?.precio || "N/A"}</p>

              {photoURL ? (
                <img src={photoURL} alt="Producto" className="w-full rounded mb-4" />
              ) : (
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-black"
                  />
                  <button
                    className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-500 transition-all duration-200"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? "Subiendo..." : "Subir foto"}
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-4 bg-transparent border border-gold px-4 py-2 rounded hover:bg-gold hover:text-black transition-all duration-200"
              >
                Escanear otro
              </button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
