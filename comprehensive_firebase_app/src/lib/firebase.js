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
// Firebase web app config (public client identifiers, safe to commit)
const firebaseConfig = {
  apiKey: 'AIzaSyAn1q6kvF031j5Idb8G7agBuz02PcCjPmY',
  authDomain: 'seminar-management-29c9f.firebaseapp.com',
  projectId: 'seminar-management-29c9f',
  storageBucket: 'seminar-management-29c9f.firebasestorage.app',
  messagingSenderId: '1075132623899',
  appId: '1:1075132623899:web:9a86e0815c9912bd1cdcbe',
  measurementId: 'G-Z8JWX9YMR7'
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


// ============ Access control (roster + domain restriction) ============

const DEFAULT_ACCESS_CONTROL = {
  allowedDomains: ['rochesterschools.org'],
  enforceRoster: true,
  tenantId: 'default'
};

export const getAccessControl = async () => {
  try {
    const snap = await getDoc(doc(db, 'systemSettings', 'accessControl'));
    if (snap.exists()) return { ...DEFAULT_ACCESS_CONTROL, ...snap.data() };
    return DEFAULT_ACCESS_CONTROL;
  } catch (error) {
    console.error('Error reading access control settings:', error);
    return DEFAULT_ACCESS_CONTROL;
  }
};

export const getRosterEntry = async (email) => {
  try {
    const snap = await getDoc(doc(db, 'roster', (email || '').toLowerCase()));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error('Error reading roster entry:', error);
    return null;
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

    // --- Access control: applies to NEW registrations only ---
    const emailLower = (email || '').toLowerCase();
    const ac = await getAccessControl();
    const domains = (ac.allowedDomains || [])
      .map((d) => d.toLowerCase().replace(/^@/, '').trim())
      .filter(Boolean);
    if (domains.length && !domains.some((d) => emailLower.endsWith('@' + d))) {
      await signOut(auth);
      throw new Error(
        'Only ' + domains.map((d) => '@' + d).join(' or ') + ' accounts can sign in. Please use your school account.'
      );
    }

    let authorizedRole = additionalData.role || 'student';
    let rosterExtras = {};
    if (ac.enforceRoster !== false) {
      const entry = await getRosterEntry(emailLower);
      if (!entry) {
        await signOut(auth);
        throw new Error('Your email is not on the school roster yet. Please contact the front office to be added.');
      }
      // The roster is authoritative for role assignment
      authorizedRole = entry.role || authorizedRole;
      rosterExtras = {
        studentId: entry.studentId || additionalData.studentId || '',
        gradeLevel: entry.gradeLevel ?? additionalData.gradeLevel ?? null,
        tenantId: entry.tenantId || ac.tenantId || 'default'
      };
      try {
        await updateDoc(doc(db, 'roster', emailLower), {
          status: 'active',
          uid: user.uid,
          activatedAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('Could not update roster entry status:', e);
      }
    }

    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        ...rosterExtras,
        role: authorizedRole,
        studentId: rosterExtras.studentId ?? (additionalData.studentId || ''),
        department: additionalData.department || '',
        phone: additionalData.phone || '',
        gradeLevel: rosterExtras.gradeLevel ?? (additionalData.gradeLevel || null),
        graduationYear: additionalData.graduationYear || null,
        status: 'active',
        createdAt,
        updatedAt: createdAt,
        lastLoginAt: createdAt
      });
      
      // Create audit log
      await createAuditLog(user.uid, 'user_created', 'users', user.uid, {
        role: authorizedRole,
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
    
    querySnapshot.forEach((docSnap) => {
      classes.push({ id: docSnap.id, ...docSnap.data() });
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
    
    for (const docSnap of querySnapshot.docs) {
      const enrollmentData = { id: docSnap.id, ...docSnap.data() };
      
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
    
    for (const docSnap of enrollmentsSnapshot.docs) {
      const enrollment = docSnap.data();
      
      // Get class details
      const classRef = doc(db, 'classes', enrollment.classId);
      const classSnap = await getDoc(classRef);
      
      if (classSnap.exists()) {
        const classData = classSnap.data();
        schedule.push({
          id: docSnap.id,
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
    
    appointmentsSnapshot.forEach((docSnap) => {
      const appointment = docSnap.data();
      schedule.push({
        id: docSnap.id,
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
    
    querySnapshot.forEach((docSnap) => {
      specialists.push({ id: docSnap.id, ...docSnap.data() });
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
    
    querySnapshot.forEach((docSnap) => {
      attendance.push({ id: docSnap.id, ...docSnap.data() });
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
    
    querySnapshot.forEach((docSnap) => {
      const credit = { id: docSnap.id, ...docSnap.data() };
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
    
    querySnapshot.forEach((docSnap) => {
      notifications.push({ id: docSnap.id, ...docSnap.data() });
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


// ============ Drop class + waitlist auto-promotion ============

export const promoteFromWaitlist = async (classId) => {
  try {
    const q = query(collection(db, 'enrollments'), where('classId', '==', classId));
    const snap = await getDocs(q);
    const waitlisted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => e.status === 'waitlisted')
      .sort(
        (a, b) =>
          (a.waitlistPosition ?? 9999) - (b.waitlistPosition ?? 9999) ||
          (a.enrollmentDate?.seconds ?? 0) - (b.enrollmentDate?.seconds ?? 0)
      );

    if (!waitlisted.length) return null;

    const next = waitlisted[0];
    await updateDoc(doc(db, 'enrollments', next.id), {
      status: 'enrolled',
      waitlistPosition: null,
      promotedAt: serverTimestamp()
    });

    // Shift remaining waitlist positions up
    for (let i = 1; i < waitlisted.length; i++) {
      if (waitlisted[i].waitlistPosition) {
        await updateDoc(doc(db, 'enrollments', waitlisted[i].id), {
          waitlistPosition: waitlisted[i].waitlistPosition - 1
        });
      }
    }

    await createNotification({
      userId: next.studentId,
      type: 'enrollment',
      title: "You're enrolled!",
      message: 'A seat opened up and you were automatically enrolled from the waitlist.',
      read: false
    });
    await createAuditLog(next.studentId, 'waitlist_promoted', 'enrollments', next.id, { classId });
    return next;
  } catch (error) {
    console.error('Error promoting from waitlist:', error);
    return null;
  }
};

export const dropClass = async (studentId, enrollmentId) => {
  try {
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    const snap = await getDoc(enrollmentRef);
    if (!snap.exists()) throw new Error('Enrollment not found');

    const enrollment = snap.data();
    if (enrollment.studentId !== studentId) {
      throw new Error('You can only drop your own enrollments');
    }
    if (enrollment.status === 'dropped') return true;

    const wasEnrolled = enrollment.status === 'enrolled';
    await updateDoc(enrollmentRef, { status: 'dropped', droppedAt: serverTimestamp() });

    const classRef = doc(db, 'classes', enrollment.classId);
    const classSnap = await getDoc(classRef);
    if (classSnap.exists()) {
      const current = classSnap.data().currentEnrollment || 0;
      await updateDoc(classRef, {
        currentEnrollment: Math.max(current - 1, 0),
        updatedAt: serverTimestamp()
      });
    }

    await createAuditLog(studentId, 'class_dropped', 'enrollments', enrollmentId, {
      classId: enrollment.classId
    });

    if (wasEnrolled) {
      await promoteFromWaitlist(enrollment.classId);
    }
    return true;
  } catch (error) {
    console.error('Error dropping class:', error);
    throw error;
  }
};
