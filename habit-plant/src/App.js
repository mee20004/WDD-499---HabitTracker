import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function App() {
  const addHabit = async () => {
    try {
      await addDoc(collection(db, "users", "USER_ID_HERE", "habits"), {
        name: "Morning Yoga",
        plantType: "Fern",
        growthLevel: 1,
        createdAt: serverTimestamp()
      });
      alert("Habit Planted!");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="App">
      <h1>My Habit Garden</h1>
      <button onClick={addHabit}>Plant a New Habit</button>
    </div>
  );
}

export default App;