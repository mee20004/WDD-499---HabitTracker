import React, { useState } from 'react';
import { db, auth, googleProvider } from './firebaseConfig';
import { signInWithPopup, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);

  const login = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    setUser(result.user);
  };

  const addHabit = async () => {
    if (!user) return alert("Log in first!");
    
    try {
      // Notice we use user.uid to make it YOUR account!
      await addDoc(collection(db, "users", user.uid, "habits"), {
        name: "Drink 2L Water",
        plantType: "Sunflower",
        growthLevel: 1,
        createdAt: serverTimestamp()
      });
      alert("Habit added to your account!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Habit Garden</h1>
      
      {!user ? (
        <button onClick={login}>Login with Google</button>
      ) : (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={addHabit}>Plant New Habit</button>
          <button onClick={() => signOut(auth).then(() => setUser(null))}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;