import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [habitName, setHabitName] = useState("");
  const [plantType, setPlantType] = useState("Cactus");
  const [habits, setHabits] = useState([]); // State to store our habit list

  // 1. Listen for Auth and then Fetch Habits
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Create a query to get habits for THIS user, ordered by newest
        const q = query(
          collection(db, "users", currentUser.uid, "habits"),
          orderBy("createdAt", "desc")
        );

        // This is the real-time listener
        const unsubscribeHabits = onSnapshot(q, (snapshot) => {
          const habitData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setHabits(habitData);
        });

        return () => unsubscribeHabits();
      } else {
        setHabits([]); // Clear habits if logged out
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);

  const addHabit = async (e) => {
    e.preventDefault();
    if (!habitName) return;
    await addDoc(collection(db, "users", user.uid, "habits"), {
      name: habitName,
      plantType: plantType,
      growthLevel: 1, // Start at level 1
      createdAt: serverTimestamp()
    });
    setHabitName("");
  };

  // Helper to turn plantType into an Emoji
  const getPlantEmoji = (type) => {
    if (type === "Cactus") return "🌵";
    if (type === "Sunflower") return "🌻";
    return "🌿";
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>🌱 Habit Garden</h1>
      
      {!user ? (
        <button onClick={login}>Login with Google</button>
      ) : (
        <div>
          <p>Welcome, {user.displayName}!</p>
          
          {/* Form to add habits */}
          <form onSubmit={addHabit}>
            <input value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="New Habit..." />
            <select value={plantType} onChange={(e) => setPlantType(e.target.value)}>
              <option value="Cactus">Cactus</option>
              <option value="Sunflower">Sunflower</option>
              <option value="Fern">Fern</option>
            </select>
            <button type="submit">Plant</button>
          </form>

          <hr />

          {/* 2. Display the List of Habits */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
            {habits.map(habit => (
              <div key={habit.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px', width: '150px' }}>
                <div style={{ fontSize: `${20 + habit.growthLevel * 10}px`, transition: '0.3s' }}>
                  {getPlantEmoji(habit.plantType)}
                </div>
                <h4>{habit.name}</h4>
                <p>Growth: {habit.growthLevel}</p>
              </div>
            ))}
          </div>

          <br />
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;