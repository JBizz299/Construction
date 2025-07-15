import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set persistence to in-memory (clears on reload)
  useEffect(() => {
    setPersistence(auth, inMemoryPersistence).catch((error) => {
      console.error('Failed to set persistence:', error);
    });
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}