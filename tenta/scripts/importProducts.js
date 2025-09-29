// scripts/importProducts.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Use SERVICE_ACCOUNT_PATH env variable or default to project root
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

// Resolve absolute path
const resolvedPath = path.resolve(serviceAccountPath);

// Check if file exists
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ Service account key not found at ${resolvedPath}`);
  process.exit(1);
}

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load products.json (assumed in project root)
const productsPath = path.resolve("./products.json");
if (!fs.existsSync(productsPath)) {
  console.error(`❌ products.json not found at ${productsPath}`);
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

async function importProducts() {
  try {
    for (const p of products) {
      const docRef = db.collection("products").doc(p.id); // ID = SKU
      await docRef.set(p);
      console.log(`✅ Imported product: ${p.id}`);
    }
    console.log("🎉 All products imported successfully!");
  } catch (err) {
    console.error("❌ Error importing products:", err);
  }
}

importProducts();
