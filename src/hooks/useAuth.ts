import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { syncUserWithFirebase, UserProfile } from "../utils/firebase";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (isConnected && address) {
        setLoading(true);
        try {
          // Sync Wallet -> Firebase
          const userProfile = await syncUserWithFirebase(address);
          setProfile(userProfile);
        } catch (e) {
          console.error("Firebase Sync Failed", e);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
      }
    };

    initAuth();
  }, [isConnected, address]);

  return {
    address,
    isConnected,
    profile, // Contains { role: 'ADMIN' } or { role: 'USER' }
    isAdmin: profile?.role === "ADMIN",
    loading,
  };
}
