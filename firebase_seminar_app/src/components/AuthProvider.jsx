import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, completeGoogleRedirect, signInWithGoogle, signOutUser } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (active) setUser(user);
    });

    completeGoogleRedirect().then((result) => {
      if (!active) return;
      if (result.user) setUser(result.user);
      setAuthError(result.error);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogle();
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: error.message };
    } finally {
      // A successful redirect navigates away immediately; this also restores
      // the button if Firebase rejects before navigation begins.
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    authError,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

