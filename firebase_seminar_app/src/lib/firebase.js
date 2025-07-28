import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { z } from 'zod';

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// SECURITY: Input validation schemas
const studentSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  photoURL: z.string().url().optional().nullable(),
});

const seminarSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  date: z.string(),
  location: z.string().min(1).max(100),
  capacity: z.number().int().min(1).max(1000),
});

// SECURITY: Rate limiting
const rateLimitMap = new Map();

const checkRateLimit = (userId, action, maxRequests = 10, windowMs = 60000) => {
  const key = `${userId}:${action}`;
  const now = Date.now();
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const requests = rateLimitMap.get(key);
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
};

// SECURITY: Audit logging
const auditLog = async (action, userId, resourceType, resourceId, details = {}) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      userId,
      resourceType,
      resourceId,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

// SECURITY: Google Sign In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // SECURITY: Validate user data
    const validatedUser = studentSchema.parse({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
    
    // Create or update user document
    await createOrUpdateStudent(validatedUser);
    
    await auditLog('user_login', user.uid, 'authentication', 'login', {
      email: user.email,
      method: 'google',
    });
    
    return { user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error: error.message };
  }
};

// SECURITY: Sign Out
export const signOutUser = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await auditLog('user_logout', user.uid, 'authentication', 'logout');
    }
    
    await signOut(auth);
    
    // Clear local storage
    localStorage.clear();
    sessionStorage.clear();
    
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error.message };
  }
};

// SECURITY: Create or update student
export const createOrUpdateStudent = async (userData) => {
  try {
    const validatedData = studentSchema.parse(userData);
    
    // SECURITY: Rate limiting
    checkRateLimit(validatedData.uid, 'student_operation');
    
    const userRef = doc(db, 'students', validatedData.uid);
    const userDoc = await getDoc(userRef);
    
    const studentData = {
      email: validatedData.email,
      displayName: validatedData.displayName,
      photoURL: validatedData.photoURL || null,
      updatedAt: serverTimestamp(),
    };
    
    if (!userDoc.exists()) {
      // Create new student
      await setDoc(userRef, {
        ...studentData,
        createdAt: serverTimestamp(),
        role: 'student', // Default role
      });
      
      await auditLog('student_created', validatedData.uid, 'student', validatedData.uid, {
        email: validatedData.email,
        displayName: validatedData.displayName,
      });
    } else {
      // Update existing student
      await setDoc(userRef, studentData, { merge: true });
      
      await auditLog('student_updated', validatedData.uid, 'student', validatedData.uid, {
        email: validatedData.email,
        displayName: validatedData.displayName,
      });
    }
    
    return userDoc.exists() ? { ...userDoc.data(), ...studentData } : studentData;
  } catch (error) {
    await auditLog('student_operation_failed', userData?.uid || 'unknown', 'student', 'unknown', {
      error: error.message,
    });
    throw new Error('Failed to process student information');
  }
};

// SECURITY: Create seminar
export const createSeminar = async (seminarData, userId) => {
  try {
    const validatedData = seminarSchema.parse(seminarData);
    
    // SECURITY: Rate limiting
    checkRateLimit(userId, 'seminar_creation');
    
    const seminarRef = await addDoc(collection(db, 'seminars'), {
      ...validatedData,
      createdBy: userId,
      currentEnrollment: 0,
      isLocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    await auditLog('seminar_created', userId, 'seminar', seminarRef.id, {
      title: validatedData.title,
      date: validatedData.date,
    });
    
    return { id: seminarRef.id, ...validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid seminar data provided');
    }
    throw error;
  }
};

// Get all seminars
export const getAllSeminars = async () => {
  try {
    const seminarsSnapshot = await getDocs(collection(db, 'seminars'));
    return seminarsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Unable to retrieve seminars');
  }
};

// SECURITY: Get user seminars
export const getUserSeminars = async (userId) => {
  try {
    checkRateLimit(userId, 'data_fetch');
    
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('studentId', '==', userId)
    );
    
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const seminarIds = enrollmentsSnapshot.docs.map(doc => doc.data().seminarId);
    
    if (seminarIds.length === 0) {
      return [];
    }
    
    // Get seminar details
    const seminarsQuery = query(
      collection(db, 'seminars'),
      where('__name__', 'in', seminarIds)
    );
    
    const seminarsSnapshot = await getDocs(seminarsQuery);
    const seminars = seminarsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    await auditLog('data_accessed', userId, 'enrollment', 'multiple', { count: seminars.length });
    
    return seminars;
  } catch (error) {
    throw new Error('Unable to retrieve seminar information');
  }
};

// SECURITY: Enroll in seminar
export const enrollInSeminar = async (seminarId, userId) => {
  try {
    checkRateLimit(userId, 'enrollment');
    
    // Check if already enrolled
    const existingEnrollmentQuery = query(
      collection(db, 'enrollments'),
      where('seminarId', '==', seminarId),
      where('studentId', '==', userId)
    );
    
    const existingEnrollment = await getDocs(existingEnrollmentQuery);
    
    if (!existingEnrollment.empty) {
      throw new Error('Already enrolled in this seminar');
    }
    
    // Create enrollment
    const enrollmentRef = await addDoc(collection(db, 'enrollments'), {
      seminarId,
      studentId: userId,
      enrolledAt: serverTimestamp(),
    });
    
    await auditLog('seminar_enrollment', userId, 'enrollment', enrollmentRef.id, {
      seminarId,
    });
    
    return { id: enrollmentRef.id, seminarId, studentId: userId };
  } catch (error) {
    throw new Error(error.message || 'Failed to enroll in seminar');
  }
};

export default app;

