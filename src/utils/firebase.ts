import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// --- PASTE YOUR CONFIG FROM FIREBASE CONSOLE HERE ---
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtlO_FZhL3v_CpKRE6UMRRKEha9qHVYEE",
  authDomain: "spotlight-base.firebaseapp.com",
  projectId: "spotlight-base",
  storageBucket: "spotlight-base.firebasestorage.app",
  messagingSenderId: "149963420998",
  appId: "1:149963420998:web:214208d9e63bdaa0fda147",
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
