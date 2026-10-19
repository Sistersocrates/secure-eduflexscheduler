import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '../lib/firebase';
import { canSwitchDashboards, DASHBOARD_ROLES } from '../lib/dashboardAccess';

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
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // View selection is scoped to this signed-in UID; it never updates Firestore roles.
  const [dashboardSelection, setDashboardSelection] = useState(null);
  const canSwitchDashboard = canSwitchDashboards(user);
  const activeRole = canSwitchDashboard && dashboardSelection?.uid === user?.uid
    ? dashboardSelection.role : userRole;
  const switchDashboard = (role) => {
    if (!canSwitchDashboard || !DASHBOARD_ROLES.includes(role)) return false;
    setDashboardSelection({ uid: user.uid, role });
    return true;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setDashboardSelection(null);
      setUserRole(null);
      setUserProfile(null);
      setLoading(true);
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

  const value = {
    user,
    userRole: activeRole,
    accountRole: userRole,
    canSwitchDashboard,
    switchDashboard,
    userProfile,
    loading,
    // Helper functions
    isStudent: activeRole === 'student',
    isTeacher: activeRole === 'teacher',
    isCounselor: activeRole === 'counselor',
    isAdmin: activeRole === 'admin',
    hasRole: (role) => activeRole === role,
    hasAnyRole: (roles) => roles.includes(activeRole)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

