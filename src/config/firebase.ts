
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCcX9sXvi_AIyAqhL1qPD0TY-e82mdXZHo",
  authDomain: "saferoute-99504.firebaseapp.com",
  projectId: "saferoute-99504",
  storageBucket: "saferoute-99504.firebasestorage.app",
  messagingSenderId: "746687651452",
  appId: "1:746687651452:web:42d8e60fa6400ffb3f33f9",
  measurementId: "G-9G80QE4D28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
