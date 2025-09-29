// scripts/importProducts.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Load service account key
const serviceAccountPath = path.resolve("./serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load products.json
const productsPath = path.resolve("./products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

async function importProducts() {
  try {
    for (const p of products) {
      const docRef = db.collection("products").doc(p.id); // ID = SKU
      await docRef.set(p);
      console.log(`Imported product: ${p.id}`);
    }
    console.log("✅ All products imported successfully!");
  } catch (err) {
    console.error("❌ Error importing products:", err);
  }
}

importProducts();
// --- IGNORE ---