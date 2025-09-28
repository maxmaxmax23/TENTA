import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

export const uploadImageAndUpdateProduct = async (sku, file) => {
  const storageRef = ref(storage, `products/${sku}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const docRef = doc(db, "products", sku);
  await updateDoc(docRef, { imageUrl: url });
  return url;
};

export { db };
