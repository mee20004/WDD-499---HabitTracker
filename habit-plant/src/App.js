import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  collection, addDoc, serverTimestamp, query, onSnapshot, 
  orderBy, doc, updateDoc, increment, deleteDoc, setDoc, getDocs, where 
} from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [viewingUid, setViewingUid] = useState(null); // UID of garden being viewed
  const [viewingName, setViewingName] = useState("My");
  const [habits, setHabits] = useState([]);
  const [friendEmail, setFriendEmail] = useState("");
  
  // Habit Creation States
  const [habitName, setHabitName] = useState("");
  const [plantType, setPlantType] = useState("Sunflower");
  const [repeatType, setRepeatType] = useState("Daily");
  const [selectedDays, setSelectedDays] = useState(new Array(7).fill(true));
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // 1. Auth & Initial User Setup
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setViewingUid(currentUser.uid); // Default to own garden
        // Save user info to a top-level 'users' collection for searching
        await setDoc(doc(db, "users", currentUser.uid), {
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        }, { merge: true });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Sync Habits based on who we are viewing
  useEffect(() => {
    if (!viewingUid) return;
    const q = query(collection(db, "users", viewingUid, "habits"), orderBy("createdAt", "desc"));
    const unsubscribeHabits = onSnapshot(q, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribeHabits();
  }, [viewingUid]);

  // 3. Friend Search Logic
  const findFriend = async () => {
    if (!friendEmail) return;
    const q = query(collection(db, "users"), where("email", "==", friendEmail.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      alert("No user found with that email!");
    } else {
      const friendData = querySnapshot.docs[0].data();
      setViewingUid(querySnapshot.docs[0].id);
      setViewingName(`${friendData.displayName}'s`);
      setFriendEmail("");
    }
  };

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => { signOut(auth); setViewingUid(null); };

  // 4. Habit Actions (Only allowed if viewing own garden)
  const addHabit = async (e) => {
    e.preventDefault();
    if (viewingUid !== user.uid) return;
    await addDoc(collection(db, "users", user.uid, "habits"), {
      name: habitName, plantType, repeatType, repeatDays: selectedDays,
      growthLevel: 0, lastWateredDate: "", createdAt: serverTimestamp(), lastWatered: serverTimestamp()
    });
    setHabitName("");
  };

  const waterPlant = async (habit) => {
    if (viewingUid !== user.uid) return; // Prevent watering friend's plants
    const today = new Date().toDateString();
    if (habit.lastWateredDate === today) return alert("Already watered today!");
    await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
      growthLevel: habit.growthLevel < 5 ? increment(1) : 5,
      lastWatered: serverTimestamp(),
      lastWateredDate: today
    });
  };

  const getPlantState = (habit) => {
    const last = habit.lastWatered?.toDate();
    if (!last) return { emoji: "🌱" };
    const hoursSince = (new Date() - last) / 3600000;
    const scheduledDaysCount = habit.repeatDays?.filter(d => d).length || 1;
    const graceFactor = Math.max(1, 7 / scheduledDaysCount);
    if (hoursSince > 48 * graceFactor) return { emoji: "🥀", isDead: true };
    if (hoursSince > 24 * graceFactor) return { emoji: "🍂", isDry: true };
    const stages = {
      Sunflower: ["🌱", "🌿", "🪴", "🌿🌻", "🌻", "✨🌻✨"],
      Cactus: ["🌱", "🌵", "🌵", "🌵", "🌵", "🌸🌵"],
      Fern: ["🌱", "🌿", "🌿", "🍃", "🍃", "🌳"]
    };
    return { emoji: stages[habit.plantType][habit.growthLevel] || "🌱" };
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>{viewingName} Garden 🌱</h1>
        {user ? (
          <div>
            {viewingUid !== user.uid && <button onClick={() => {setViewingUid(user.uid); setViewingName("My");}} style={styles.backBtn}>Back to My Garden</button>}
            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          </div>
        ) : <button onClick={login} style={styles.loginBtn}>Login with Google</button>}
      </header>

      {user && (
        <main>
          {/* Friend Search Bar */}
          <div style={styles.searchBar}>
            <input value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} placeholder="Enter friend's email..." style={styles.searchInput} />
            <button onClick={findFriend} style={styles.searchBtn}>Visit Garden</button>
          </div>

          {/* Habit Form (Only visible in YOUR garden) */}
          {viewingUid === user.uid && (
            <div style={styles.formCard}>
              <form onSubmit={addHabit}>
                <div style={styles.inputGroup}>
                  <input value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="Habit Name..." style={styles.input} />
                  <select value={plantType} onChange={(e) => setPlantType(e.target.value)} style={styles.select}>
                    <option value="Sunflower">Sunflower</option><option value="Cactus">Cactus</option><option value="Fern">Fern</option>
                  </select>
                  <select value={repeatType} onChange={(e) => {
                    setRepeatType(e.target.value);
                    if (e.target.value === "Daily") setSelectedDays(new Array(7).fill(true));
                    if (e.target.value === "Work Days") setSelectedDays([false, true, true, true, true, true, false]);
                  }} style={styles.select}>
                    <option value="Daily">Daily</option><option value="Work Days">Work Days</option><option value="Custom">Custom</option>
                  </select>
                </div>
                {repeatType === "Custom" && (
                  <div style={styles.dayPicker}>
                    {dayNames.map((day, i) => (
                      <div key={day} onClick={() => { const d = [...selectedDays]; d[i] = !d[i]; setSelectedDays(d); }} 
                        style={{...styles.dayCircle, backgroundColor: selectedDays[i] ? '#2ecc71' : '#eee', color: selectedDays[i] ? 'white' : '#777'}}>
                        {day[0]}
                      </div>
                    ))}
                  </div>
                )}
                <button type="submit" style={styles.addBtn}>Plant</button>
              </form>
            </div>
          )}

          {/* Garden Grid */}
          
          <div style={styles.gardenGrid}>
            {habits.map(habit => {
              const state = getPlantState(habit);
              const isScheduledToday = habit.repeatDays?.[new Date().getDay()];
              const isWateredToday = habit.lastWateredDate === new Date().toDateString();
              return (
                <div key={habit.id} style={styles.card}>
                  {viewingUid === user.uid && <button onClick={() => deleteDoc(doc(db, "users", user.uid, "habits", habit.id))} style={styles.deleteX}>×</button>}
                  <div style={styles.emoji}>{state.emoji}</div>
                  <h3>{habit.name}</h3>
                  <button 
                    disabled={viewingUid !== user.uid || !isScheduledToday || isWateredToday || state.isDead}
                    onClick={() => waterPlant(habit)}
                    style={{
                      ...styles.waterBtn,
                      backgroundColor: viewingUid !== user.uid ? '#eee' : (!isScheduledToday ? '#f0f0f0' : isWateredToday ? '#bdc3c7' : '#3498db')
                    }}
                  >
                    {viewingUid !== user.uid ? "Spectating" : (!isScheduledToday ? "Rest Day" : isWateredToday ? "Done" : "Water 💧")}
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}

const styles = {
  container: { textAlign: 'center', fontFamily: 'system-ui', padding: '20px', backgroundColor: '#fdfdfd', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto 20px' },
  backBtn: { marginRight: '10px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none' },
  searchBar: { marginBottom: '20px' },
  searchInput: { padding: '10px', borderRadius: '5px 0 0 5px', border: '1px solid #ddd', width: '250px' },
  searchBtn: { padding: '10px', borderRadius: '0 5px 5px 0', border: '1px solid #3498db', backgroundColor: '#3498db', color: 'white', cursor: 'pointer' },
  formCard: { backgroundColor: 'white', padding: '20px', borderRadius: '15px', display: 'inline-block', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '30px' },
  inputGroup: { display: 'flex', gap: '10px', marginBottom: '10px' },
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ddd' },
  select: { padding: '10px', borderRadius: '5px', border: '1px solid #ddd' },
  dayPicker: { display: 'flex', justifyContent: 'center', gap: '5px', margin: '15px 0' },
  dayCircle: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' },
  addBtn: { padding: '10px 30px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
  gardenGrid: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' },
  card: { position: 'relative', backgroundColor: 'white', padding: '20px', borderRadius: '20px', width: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  deleteX: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ddd', cursor: 'pointer' },
  emoji: { fontSize: '60px', margin: '10px 0' },
  waterBtn: { border: 'none', padding: '10px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: 'bold' }
};

export default App;