import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '../lib/firebase';

const AuthContext = createContext({});

// Accounts allowed to "view as" any role (demo / staff review).
export const ROLE_SWITCHER_EMAILS = [
  'danielle.staley3@gmail.com',
  'dastaley@rochesterschools.org',
  'mizinnel@rochesterschools.org',
  'judoschadis@rochesterschools.org',
  'kelynch2@rochesterschools.org',
  'maholtorf@rochesterschools.org'
];
export const SWITCHABLE_ROLES = ['student', 'teacher', 'counselor', 'specialist', 'admin'];
const ACTING_ROLE_KEY = 'eduflex_acting_role';
const readActingRole = () => {
  try { return localStorage.getItem(ACTING_ROLE_KEY); } catch { return null; }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actingRole, setActingRoleState] = useState(readActingRole());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Get user profile from Firestore
          const profile = await getUserProfile(user.uid);
          
          if (profile) {
            setUserRole(profile.role || 'student');
            setUserProfile(profile);
          } else {
            // Default role if no profile exists
            setUserRole('student');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserRole('student'); // Fallback to student role
          setUserProfile(null);
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const canSwitchRoles = !!user?.email && ROLE_SWITCHER_EMAILS.includes(user.email.toLowerCase());
  const storedRole = userRole;
  const effectiveRole = canSwitchRoles
    ? (SWITCHABLE_ROLES.includes(actingRole) ? actingRole : 'admin')
    : storedRole;

  const setActingRole = (role) => {
    if (!canSwitchRoles || !SWITCHABLE_ROLES.includes(role)) return;
    setActingRoleState(role);
    try { localStorage.setItem(ACTING_ROLE_KEY, role); } catch { /* ignore */ }
  };

  const value = {
    user,
    userRole: effectiveRole,
    storedRole,
    canSwitchRoles,
    setActingRole,
    userProfile,
    loading,
    // Helper functions
    isStudent: effectiveRole === 'student',
    isTeacher: effectiveRole === 'teacher',
    isCounselor: effectiveRole === 'counselor',
    isAdmin: effectiveRole === 'admin',
    hasRole: (role) => effectiveRole === role,
    hasAnyRole: (roles) => roles.includes(effectiveRole)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

