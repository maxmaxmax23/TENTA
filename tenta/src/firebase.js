// src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRTvATe5LG7LNb05AqTTYpAV53Y6B6td0",
  authDomain: "glowupbb-7b7bc.firebaseapp.com",
  projectId: "glowupbb-7b7bc",
  storageBucket: "glowupbb-7b7bc.firebasestorage.app",
  messagingSenderId: "744754651075",
  appId: "1:744754651075:web:4b7052c6effcbbe384e776",
  measurementId: "G-84S8472RN2"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
