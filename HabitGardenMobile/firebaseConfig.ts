import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAqQp-d5xtT_pjPK5n6t7PGswEjb0aXero",
  authDomain: "goalgrower-2a859.firebaseapp.com",
  projectId: "goalgrower-2a859",
  storageBucket: "goalgrower-2a859.firebasestorage.app",
  messagingSenderId: "1043088781890",
  appId: "1:1043088781890:web:4b11eb3ac612c2026c33db",
  measurementId: "G-TWXPJMVL13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export tools for use in your app
export const db = getFirestore(app);
export const auth = getAuth(app);