import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxuWY1Etx62mfYkbek4yXMAdx0s3qBtZk",
  authDomain: "noteapp-2b9c4.firebaseapp.com",
  projectId: "noteapp-2b9c4",
  storageBucket: "noteapp-2b9c4.firebasestorage.app",
  messagingSenderId: "1072647028318",
  appId: "1:1072647028318:web:de970751ac88c47f38becf",
  measurementId: "G-NRD1GM8BLV"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);

export default app;
