import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration - DO NOT EDIT
const firebaseConfig = {
  "projectId": "lryics-locker",
  "appId": "1:630263628513:web:9d54cfca9e8ace7c65ada0",
  "storageBucket": "lryics-locker.firebasestorage.app",
  "apiKey": "AIzaSyBwQ2TO4_4evTeOqYp8s-ZDC1G5Q76mvUc",
  "authDomain": "lryics-locker.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "630263628513"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth };
