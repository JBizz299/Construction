import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA22Kv7Vse7U5GNxZemc5sy1VrvLP_vKLQ",
  authDomain: "contractorhub-1.firebaseapp.com",
  projectId: "contractorhub-1",
  storageBucket: "contractorhub-1",
  messagingSenderId: "64759680655",
  appId: "1:64759680655:web:289b56f259cfc7872ceafa",
  measurementId: "G-Q82RRMSBTQ",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

//Set session-only persistence early, before any login state is restored
setPersistence(auth, browserSessionPersistence).catch((err) =>
  console.error('Failed to set auth persistence:', err)
);