import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, set, get, child } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

export async function getProduct(productId) {
  const db = database;
  const snapshot = await get(child(dbRef(db), `products/${productId}`));
  return snapshot.exists() ? snapshot.val() : { id: productId };
}

export async function uploadImageAndUpdateProduct(productId, file) {
  const storageRef = ref(storage, `products/${productId}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Update Realtime Database
  const db = database;
  const productRef = dbRef(db, `products/${productId}/imageUrl`);
  await set(productRef, url);

  return url;
}

export default app;
