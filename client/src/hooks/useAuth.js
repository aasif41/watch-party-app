import { useState, useEffect, useMemo } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export const useAuth = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Enrich the user object with a guaranteed displayName
  const user = useMemo(() => {
    if (!firebaseUser) return null;
    const resolvedName =
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Watcher");
    return {
      ...firebaseUser,
      // Override displayName so every consumer gets a valid name
      displayName: resolvedName,
      // Keep original Firebase properties accessible
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
    };
  }, [firebaseUser]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-Out Error:", error);
      throw error;
    }
  };

  return { user, loading, signInWithGoogle, signOut };
};
