import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// 1. You need to import getFirestore
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyAqQp-d5xtT_pjPK5n6t7PGswEjb0aXero",
  authDomain: "goalgrower-2a859.firebaseapp.com",
  projectId: "goalgrower-2a859",
  storageBucket: "goalgrower-2a859.firebasestorage.app",
  messagingSenderId: "1043088781890",
  appId: "1:1043088781890:web:4b11eb3ac612c2026c33db",
  measurementId: "G-TWXPJMVL13"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Initialize Firestore and EXPORT it so App.js can see it
export const db = getFirestore(app);