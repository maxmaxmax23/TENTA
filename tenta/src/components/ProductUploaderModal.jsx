import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export default function ProductUploaderModal({ codigo, info, onClose }) {
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
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all sm:p-8">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4 text-center sm:text-left"
                >
                  CODIGO: {codigo}
                </Dialog.Title>

                {info ? (
                  <div className="mb-4 text-center sm:text-left">
                    <p className="font-medium">Descripción: {info.descripcion}</p>
                    <p className="font-medium">Precio: ${info.precio}</p>
                  </div>
                ) : (
                  <p className="mb-4 text-center sm:text-left">
                    No hay datos para este código
                  </p>
                )}

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="SKU"
                    className="w-32 h-32 object-cover rounded mb-4 mx-auto sm:mx-0"
                  />
                ) : (
                  <>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="mb-4 w-full"
                    />
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
                    >
                      {loading ? "Uploading..." : "Upload Image"}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="mt-4 w-full bg-gray-300 text-black p-2 rounded hover:bg-gray-400 transition"
                  onClick={onClose}
                >
                  Close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
