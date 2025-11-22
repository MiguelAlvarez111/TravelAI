// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFeXlHL7otKuL2OyaWmY50ma-W1WIEKhk",
  authDomain: "viajeia-f502b.firebaseapp.com",
  databaseURL: "https://viajeia-f502b-default-rtdb.firebaseio.com",
  projectId: "viajeia-f502b",
  storageBucket: "viajeia-f502b.firebasestorage.app",
  messagingSenderId: "733742734822",
  appId: "1:733742734822:web:029a7f516cbb6b87200a27",
  measurementId: "G-98WD7E9RL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;

