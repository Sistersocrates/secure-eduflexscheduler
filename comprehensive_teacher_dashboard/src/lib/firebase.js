import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
export const storage = getStorage(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// User management functions
export const createUserProfile = async (user, additionalData = {}) => {
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
        role: additionalData.role || 'student',
        studentId: additionalData.studentId || '',
        department: additionalData.department || '',
        phone: additionalData.phone || '',
        gradeLevel: additionalData.gradeLevel || null,
        graduationYear: additionalData.graduationYear || null,
        status: 'active',
        createdAt,
        updatedAt: createdAt,
        lastLoginAt: createdAt
      });
      
      // Create audit log
      await createAuditLog(user.uid, 'user_created', 'users', user.uid, {
        role: additionalData.role || 'student',
        email: email
      });
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  } else {
    // Update last login
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });
  }
  
  return userRef;
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    // Create audit log
    await createAuditLog(userId, 'user_updated', 'users', userId, updateData);
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Class management functions
export const getAvailableClasses = async (filters = {}) => {
  try {
    let q = collection(db, 'classes');
    
    // Apply filters
    if (filters.hour) {
      q = query(q, where('hour', '==', filters.hour));
    }
    if (filters.day) {
      q = query(q, where('availableDays', 'array-contains', filters.day));
    }
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    q = query(q, where('status', '==', 'active'), orderBy('title'));
    
    const querySnapshot = await getDocs(q);
    const classes = [];
    
    querySnapshot.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() });
    });
    
    return classes;
  } catch (error) {
    console.error('Error getting available classes:', error);
    throw error;
  }
};

export const enrollInClass = async (studentId, classId) => {
  try {
    // Check if already enrolled
    const enrollmentQuery = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      where('classId', '==', classId)
    );
    
    const existingEnrollment = await getDocs(enrollmentQuery);
    if (!existingEnrollment.empty) {
      throw new Error('Already enrolled in this class');
    }
    
    // Get class info to check capacity
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    const currentEnrollment = classData.currentEnrollment || 0;
    const capacity = classData.capacity || 0;
    
    // Create enrollment record
    const enrollmentData = {
      studentId,
      classId,
      status: currentEnrollment < capacity ? 'enrolled' : 'waitlisted',
      enrollmentDate: serverTimestamp(),
      waitlistPosition: currentEnrollment >= capacity ? (currentEnrollment - capacity + 1) : null
    };
    
    const enrollmentRef = await addDoc(collection(db, 'enrollments'), enrollmentData);
    
    // Update class enrollment count
    await updateDoc(classRef, {
      currentEnrollment: currentEnrollment + 1,
      updatedAt: serverTimestamp()
    });
    
    // Create audit log
    await createAuditLog(studentId, 'class_enrolled', 'enrollments', enrollmentRef.id, {
      classId,
      status: enrollmentData.status
    });
    
    return { id: enrollmentRef.id, ...enrollmentData };
    
  } catch (error) {
    console.error('Error enrolling in class:', error);
    throw error;
  }
};

export const getStudentEnrollments = async (studentId) => {
  try {
    const q = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      orderBy('enrollmentDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const enrollments = [];
    
    for (const doc of querySnapshot.docs) {
      const enrollmentData = { id: doc.id, ...doc.data() };
      
      // Get class details
      const classRef = doc(db, 'classes', enrollmentData.classId);
      const classSnap = await getDoc(classRef);
      
      if (classSnap.exists()) {
        enrollmentData.classDetails = { id: classSnap.id, ...classSnap.data() };
      }
      
      enrollments.push(enrollmentData);
    }
    
    return enrollments;
  } catch (error) {
    console.error('Error getting student enrollments:', error);
    throw error;
  }
};

// Schedule management functions
export const getStudentSchedule = async (studentId, dateRange = null) => {
  try {
    // Get enrolled classes
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      where('status', '==', 'enrolled')
    );
    
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const schedule = [];
    
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = doc.data();
      
      // Get class details
      const classRef = doc(db, 'classes', enrollment.classId);
      const classSnap = await getDoc(classRef);
      
      if (classSnap.exists()) {
        const classData = classSnap.data();
        schedule.push({
          id: doc.id,
          type: 'class',
          title: classData.title,
          description: classData.description,
          hour: classData.hour,
          days: classData.availableDays,
          location: classData.location,
          teacher: classData.teacherName,
          classId: enrollment.classId
        });
      }
    }
    
    // Get appointments
    let appointmentsQuery = query(
      collection(db, 'appointments'),
      where('studentId', '==', studentId),
      where('status', 'in', ['scheduled', 'confirmed'])
    );
    
    if (dateRange) {
      appointmentsQuery = query(
        appointmentsQuery,
        where('startTime', '>=', dateRange.start),
        where('startTime', '<=', dateRange.end)
      );
    }
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    
    appointmentsSnapshot.forEach((doc) => {
      const appointment = doc.data();
      schedule.push({
        id: doc.id,
        type: 'appointment',
        title: appointment.title,
        description: appointment.description,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        location: appointment.location,
        specialist: appointment.specialistName
      });
    });
    
    return schedule;
  } catch (error) {
    console.error('Error getting student schedule:', error);
    throw error;
  }
};

// Appointment management functions
export const getAvailableSpecialists = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'specialist'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const specialists = [];
    
    querySnapshot.forEach((doc) => {
      specialists.push({ id: doc.id, ...doc.data() });
    });
    
    return specialists;
  } catch (error) {
    console.error('Error getting available specialists:', error);
    throw error;
  }
};

export const requestAppointment = async (appointmentData) => {
  try {
    const appointment = {
      ...appointmentData,
      status: 'requested',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const appointmentRef = await addDoc(collection(db, 'appointments'), appointment);
    
    // Create audit log
    await createAuditLog(appointmentData.studentId, 'appointment_requested', 'appointments', appointmentRef.id, {
      specialistId: appointmentData.specialistId,
      startTime: appointmentData.startTime
    });
    
    return { id: appointmentRef.id, ...appointment };
  } catch (error) {
    console.error('Error requesting appointment:', error);
    throw error;
  }
};

// Progress tracking functions
export const getStudentAttendance = async (studentId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId)
    );
    
    if (filters.classId) {
      q = query(q, where('classId', '==', filters.classId));
    }
    
    if (filters.dateRange) {
      q = query(
        q,
        where('date', '>=', filters.dateRange.start),
        where('date', '<=', filters.dateRange.end)
      );
    }
    
    q = query(q, orderBy('date', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const attendance = [];
    
    querySnapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    
    return attendance;
  } catch (error) {
    console.error('Error getting student attendance:', error);
    throw error;
  }
};

export const getStudentCredits = async (studentId) => {
  try {
    const q = query(
      collection(db, 'credits'),
      where('studentId', '==', studentId),
      orderBy('earnedDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const credits = [];
    let totalCredits = 0;
    const creditsByType = {};
    
    querySnapshot.forEach((doc) => {
      const credit = { id: doc.id, ...doc.data() };
      credits.push(credit);
      
      totalCredits += credit.creditAmount || 0;
      
      if (!creditsByType[credit.creditType]) {
        creditsByType[credit.creditType] = 0;
      }
      creditsByType[credit.creditType] += credit.creditAmount || 0;
    });
    
    return {
      credits,
      totalCredits,
      creditsByType
    };
  } catch (error) {
    console.error('Error getting student credits:', error);
    throw error;
  }
};

// Notification functions
export const getStudentNotifications = async (studentId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', studentId)
    );
    
    if (filters.unreadOnly) {
      q = query(q, where('read', '==', false));
    }
    
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    
    q = query(q, orderBy('createdAt', 'desc'), limit(50));
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting student notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const createNotification = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    };
    
    const notificationRef = await addDoc(collection(db, 'notifications'), notification);
    return { id: notificationRef.id, ...notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Audit logging function
export const createAuditLog = async (userId, action, resourceType, resourceId, details = {}) => {
  try {
    const auditLog = {
      userId,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side' // Would be populated server-side in production
    };
    
    await addDoc(collection(db, 'auditLogs'), auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error for audit logging failures
  }
};

// Real-time listeners
export const subscribeToUserNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, callback);
};

export const subscribeToStudentSchedule = (studentId, callback) => {
  const q = query(
    collection(db, 'enrollments'),
    where('studentId', '==', studentId)
  );
  
  return onSnapshot(q, callback);
};

// Utility functions
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  
  return new Date(timestamp);
};

export const createTimestamp = (date) => {
  return Timestamp.fromDate(new Date(date));
};

export default app;

