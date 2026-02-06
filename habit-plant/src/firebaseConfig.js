// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);