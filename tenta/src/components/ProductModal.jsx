import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export default function ProductModal({ scanResult, product, onClose }) {
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    const storageRef = ref(storage, `products/${scanResult}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImageUrl(url);
    setLoading(false);
  };

  return (
    <Transition appear show as={Fragment}>
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
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-black p-6 rounded-xl w-full max-w-md flex flex-col gap-4">
              <Dialog.Title className="text-xl font-bold text-gold">{product?.descripcion || scanResult}</Dialog.Title>
              <p className="text-white">Precio: ${product?.precio || "N/A"}</p>
              {imageUrl ? (
                <img src={imageUrl} alt="Producto" className="w-full rounded-md" />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleUpload(e.target.files[0])}
                  className="p-2 rounded-lg bg-black/80 border border-gold text-white"
                />
              )}
              {loading && <p className="text-white">Cargando...</p>}
              <button
                onClick={onClose}
                className="mt-4 bg-gold text-black py-2 rounded-lg font-bold hover:opacity-80 transition"
              >
                Escanear Otro
              </button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
