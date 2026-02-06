import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, SafeAreaView, ActivityIndicator, Platform 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { 
  signInWithCredential, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

// Database config
import { db, auth } from '../../firebaseConfig';
import { 
  collection, addDoc, serverTimestamp, query, 
  onSnapshot, orderBy, doc, deleteDoc 
} from "firebase/firestore";

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [habitName, setHabitName] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Configure the Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '1043088781890-l5c3ltnel8focg814gsjquthkrou0221.apps.googleusercontent.com',
    iosClientId: '1043088781890-8ghfebnkm1hrdmrq7r0csgvadf2vg3bk.apps.googleusercontent.com',
    // THIS LINE IS THE FIX: It tells Google to use the Expo Proxy
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'habitgarden',
    }),
  });

  // 2. Handle the Google Auth Response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((e) => console.log("Firebase Error", e));
    }
  }, [response]);

  // 3. Listen for User state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const q = query(collection(db, "users", currentUser.uid, "habits"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
          setHabits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2ecc71" /></View>;

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{fontSize: 70}}>🌻</Text>
        <Text style={styles.title}>Habit Garden</Text>
        <TouchableOpacity 
          style={styles.loginBtn} 
          disabled={!request} 
          onPress={() => promptAsync()}
        >
          <Text style={styles.loginText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Garden</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={{color: '#e74c3c', fontWeight: 'bold'}}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputBox}>
        <TextInput 
          style={styles.input} 
          placeholder="New Habit..." 
          value={habitName}
          onChangeText={setHabitName}
        />
        <TouchableOpacity style={styles.addBtn} onPress={async () => {
          if (!habitName.trim()) return;
          await addDoc(collection(db, "users", user.uid, "habits"), {
            name: habitName, growthLevel: 0, createdAt: serverTimestamp()
          });
          setHabitName("");
        }}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Plant</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={habits}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={{fontSize: 40}}>🌱</Text>
            <Text style={{fontWeight: 'bold', marginTop: 10}}>{item.name}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  title: { fontSize: 26, fontWeight: 'bold' },
  inputBox: { flexDirection: 'row', padding: 20 },
  input: { flex: 1, borderBottomWidth: 1, borderColor: '#eee', marginRight: 10, padding: 8 },
  addBtn: { backgroundColor: '#2ecc71', padding: 12, borderRadius: 10 },
  card: { flex: 1, alignItems: 'center', padding: 20, margin: 10, backgroundColor: '#fff', borderRadius: 20, elevation: 3, shadowOpacity: 0.1 },
  loginBtn: { backgroundColor: '#4285F4', padding: 15, borderRadius: 30, paddingHorizontal: 40, marginTop: 20 },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});