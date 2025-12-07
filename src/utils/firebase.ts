import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ---------------------------------------------------

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- HELPER FUNCTIONS ---

export type UserRole = "ADMIN" | "USER" | "GUARD";

export interface UserProfile {
  address: string;
  role: UserRole;
  name?: string; // Optional: "Ali"
  joinedAt: number;
}

// 1. Login / Create User
// This runs automatically when a wallet connects
export const syncUserWithFirebase = async (
  address: string
): Promise<UserProfile> => {
  const userRef = doc(db, "users", address.toLowerCase()); // Use address as ID
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // User exists, return profile
    return userSnap.data() as UserProfile;
  } else {
    // New User! Create default profile
    const newProfile: UserProfile = {
      address: address.toLowerCase(),
      role: "USER", // Default role
      joinedAt: Date.now(),
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
};

// 2. Admin Feature: Make someone an Admin
// You can call this manually from the JS Console during the hackathon
export const makeAdmin = async (address: string) => {
  const userRef = doc(db, "users", address.toLowerCase());
  await setDoc(userRef, { role: "ADMIN" }, { merge: true });
  console.log(`${address} is now an Admin!`);
};
