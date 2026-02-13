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
  onSnapshot, orderBy 
} from "firebase/firestore";

// This allows the browser to close and return to the app after login
WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [habitName, setHabitName] = useState("");
  const [loading, setLoading] = useState(true);

// 1. Configure the Google Auth Request for a NATIVE BUILD
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Keep your Web Client ID for Firebase verification
    webClientId: '1043088781890-l5c3ltnel8focg814gsjquthkrou0221.apps.googleusercontent.com',
    iosClientId: 'YOUR_NEW_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_NEW_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    
    // MOVED HERE: No longer red because it's in the correct object
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'habitgarden',
    }),
  });

  // 2. Handle the Google Auth Response
  useEffect(() => {
    if (response?.type === 'success') {
      // In native builds, the token is in authentication.idToken
      const { idToken } = response.authentication || {};
      
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential)
          .catch((e) => console.error("Firebase Auth Error:", e));
      }
    }
  }, [response]);

  // 3. Listen for User state and sync Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        const q = query(
          collection(db, "users", currentUser.uid, "habits"), 
          orderBy("createdAt", "desc")
        );
        const unsubSnapshot = onSnapshot(q, (snapshot) => {
          setHabits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsubSnapshot;
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2ecc71" />
    </View>
  );

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{fontSize: 70}}>🌻</Text>
        <Text style={styles.title}>Habit Garden</Text>
        <TouchableOpacity 
          style={[styles.loginBtn, !request && { opacity: 0.5 }]} 
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
          try {
            await addDoc(collection(db, "users", user.uid, "habits"), {
              name: habitName, 
              growthLevel: 0, 
              createdAt: serverTimestamp()
            });
            setHabitName("");
          } catch (err) {
            console.error("Error adding habit:", err);
          }
        }}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Plant</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={habits}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={{fontSize: 40}}>🌱</Text>
            <Text style={{fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>{item.name}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'ios' ? 0 : 40 },
  title: { fontSize: 26, fontWeight: 'bold' },
  inputBox: { flexDirection: 'row', padding: 20 },
  input: { flex: 1, borderBottomWidth: 1, borderColor: '#eee', marginRight: 10, padding: 8 },
  addBtn: { backgroundColor: '#2ecc71', padding: 12, borderRadius: 10 },
  card: { flex: 1, alignItems: 'center', padding: 20, margin: 10, backgroundColor: '#fff', borderRadius: 20, elevation: 3, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5 },
  loginBtn: { backgroundColor: '#4285F4', padding: 15, borderRadius: 30, paddingHorizontal: 40, marginTop: 20 },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});