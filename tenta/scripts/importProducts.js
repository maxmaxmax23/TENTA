// scripts/importProducts.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // load env variables from .env

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = JSON.parse(fs.readFileSync("./products.json", "utf-8"));

async function importProducts() {
  for (const p of products) {
    const docRef = doc(db, "products", p.id);
    await setDoc(docRef, p);
    console.log(`Imported ${p.id}`);
  }
  console.log("All products imported successfully.");
}

importProducts().catch(console.error);
