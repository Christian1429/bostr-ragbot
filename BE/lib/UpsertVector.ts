import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Upsert vector function
export async function upsertVector(
  collectionName: string,
  vectorId: string,
  vectorData: { embedding: number[]; [key: string]: any }
) {
  const docRef = doc(db, collectionName, vectorId);
  await setDoc(docRef, vectorData, { merge: true });
}
