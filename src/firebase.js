import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "REDACTED_API_KEY",
  authDomain: "pikmin-fighters.firebaseapp.com",
  projectId: "pikmin-fighters",
  storageBucket: "pikmin-fighters.firebasestorage.app",
  messagingSenderId: "REDACTED_SENDER_ID",
  appId: "1:REDACTED_SENDER_ID:web:a99fd19f0ae042218c0b2a"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
