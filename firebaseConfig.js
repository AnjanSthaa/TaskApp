import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getDatabase } from 'firebase/database'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAttt_Ao8yaKrclEMqaTlEyfHRZzVHxx90',
  authDomain: 'my-app-8bdea.firebaseapp.com',
  databaseURL:
    'https://my-app-8bdea-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'my-app-8bdea',
  storageBucket: 'my-app-8bdea.firebasestorage.app',
  messagingSenderId: '382468579970',
  appId: '1:382468579970:android:ef4bdf2f8670ccff858a9b',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize auth with AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})

// Initialize services
const db = getFirestore(app)
const storage = getStorage(app)
const realtimeDb = getDatabase(app)

// Export Firebase services
export { auth, db, storage, realtimeDb }
