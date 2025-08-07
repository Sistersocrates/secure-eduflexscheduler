import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create or update user document
    await createUserDocument(user);
    
    // Log authentication event
    await logAuditEvent('user_login', user.uid, 'authentication', user.uid, {
      method: 'google_oauth',
      timestamp: new Date().toISOString()
    });
    
    return { user, error: null };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { user: null, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await logAuditEvent('user_logout', user.uid, 'authentication', user.uid, {
        timestamp: new Date().toISOString()
      });
    }
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Sign-out error:', error);
    return { success: false, error: error.message };
  }
};

// User management functions
export const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = serverTimestamp();
    
    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        role: additionalData.role || 'student', // Default role
        department: additionalData.department || '',
        studentId: additionalData.studentId || '',
        phoneNumber: additionalData.phoneNumber || '',
        address: additionalData.address || '',
        emergencyContact: additionalData.emergencyContact || '',
        preferences: {
          notifications: true,
          emailUpdates: true,
          theme: 'light'
        },
        createdAt,
        updatedAt: createdAt,
        lastLoginAt: serverTimestamp(),
        isActive: true
      });
      
      await logAuditEvent('user_created', user.uid, 'user', user.uid, {
        role: additionalData.role || 'student'
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  } else {
    // Update last login time
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });
  }
};

export const getUserDocument = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    await logAuditEvent('user_updated', uid, 'user', uid, updates);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Seminar management functions
export const createSeminar = async (seminarData, creatorId) => {
  try {
    const seminarRef = await addDoc(collection(db, 'seminars'), {
      ...seminarData,
      createdBy: creatorId,
      currentEnrollment: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    await logAuditEvent('seminar_created', creatorId, 'seminar', seminarRef.id, seminarData);
    return { id: seminarRef.id, success: true, error: null };
  } catch (error) {
    console.error('Error creating seminar:', error);
    return { success: false, error: error.message };
  }
};

export const getSeminars = async (filters = {}) => {
  try {
    let q = collection(db, 'seminars');
    
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const seminars = [];
    
    querySnapshot.forEach((doc) => {
      seminars.push({ id: doc.id, ...doc.data() });
    });
    
    return seminars;
  } catch (error) {
    console.error('Error getting seminars:', error);
    return [];
  }
};

// Enrollment functions
export const enrollInSeminar = async (studentId, seminarId) => {
  try {
    // Check if already enrolled
    const enrollmentQuery = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      where('seminarId', '==', seminarId)
    );
    
    const existingEnrollment = await getDocs(enrollmentQuery);
    if (!existingEnrollment.empty) {
      return { success: false, error: 'Already enrolled in this seminar' };
    }
    
    // Create enrollment
    const enrollmentRef = await addDoc(collection(db, 'enrollments'), {
      studentId,
      seminarId,
      enrolledAt: serverTimestamp(),
      status: 'enrolled',
      attendance: [],
      grade: null
    });
    
    // Update seminar enrollment count
    const seminarRef = doc(db, 'seminars', seminarId);
    const seminarSnap = await getDoc(seminarRef);
    
    if (seminarSnap.exists()) {
      const currentCount = seminarSnap.data().currentEnrollment || 0;
      await updateDoc(seminarRef, {
        currentEnrollment: currentCount + 1
      });
    }
    
    await logAuditEvent('student_enrolled', studentId, 'enrollment', enrollmentRef.id, {
      seminarId
    });
    
    return { id: enrollmentRef.id, success: true, error: null };
  } catch (error) {
    console.error('Error enrolling in seminar:', error);
    return { success: false, error: error.message };
  }
};

export const getStudentEnrollments = async (studentId) => {
  try {
    const q = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      orderBy('enrolledAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const enrollments = [];
    
    for (const doc of querySnapshot.docs) {
      const enrollment = { id: doc.id, ...doc.data() };
      
      // Get seminar details
      const seminarRef = doc(db, 'seminars', enrollment.seminarId);
      const seminarSnap = await getDoc(seminarRef);
      
      if (seminarSnap.exists()) {
        enrollment.seminar = { id: seminarSnap.id, ...seminarSnap.data() };
      }
      
      enrollments.push(enrollment);
    }
    
    return enrollments;
  } catch (error) {
    console.error('Error getting student enrollments:', error);
    return [];
  }
};

// Audit logging for FERPA compliance
export const logAuditEvent = async (action, userId, resourceType, resourceId, details = {}) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      userId,
      resourceType,
      resourceId,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side' // Would need server-side implementation for real IP
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

// Real-time listeners
export const subscribeToSeminars = (callback, filters = {}) => {
  let q = collection(db, 'seminars');
  
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  
  q = query(q, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const seminars = [];
    snapshot.forEach((doc) => {
      seminars.push({ id: doc.id, ...doc.data() });
    });
    callback(seminars);
  });
};

export const subscribeToUserEnrollments = (userId, callback) => {
  const q = query(
    collection(db, 'enrollments'),
    where('studentId', '==', userId),
    orderBy('enrolledAt', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const enrollments = [];
    
    for (const doc of snapshot.docs) {
      const enrollment = { id: doc.id, ...doc.data() };
      
      // Get seminar details
      const seminarRef = doc(db, 'seminars', enrollment.seminarId);
      const seminarSnap = await getDoc(seminarRef);
      
      if (seminarSnap.exists()) {
        enrollment.seminar = { id: seminarSnap.id, ...seminarSnap.data() };
      }
      
      enrollments.push(enrollment);
    }
    
    callback(enrollments);
  });
};

export default app;

