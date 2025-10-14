import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// Rate limiting helper
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

// Audit logging helper
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

// Helper function to normalize seminar data from complex schema
const normalizeSeminar = (seminar) => {
  const normalized = {
    id: seminar.id,
    title: seminar.title || 'Untitled Seminar',
    description: seminar.description || '',
    category: seminar.category || '',
    code: seminar.code || '',
    credits: seminar.credits || 0,
    status: seminar.status || 'active',
    tenantId: seminar.tenantId || 'default_tenant',
    
    // Normalize instructor data
    teacherName: seminar.instructor?.name || seminar.teacherName || 'Unknown Teacher',
    teacherEmail: seminar.instructor?.email || seminar.teacherEmail || '',
    teacherUid: seminar.instructor?.uid || seminar.teacherUid || '',
    
    // Normalize enrollment data
    capacity: seminar.enrollment?.maxStudents || seminar.capacity || 0,
    currentEnrollment: seminar.enrollment?.currentCount || seminar.currentEnrollment || 0,
    requiresApproval: seminar.enrollment?.requiresApproval || false,
    waitlistCount: seminar.enrollment?.waitlistCount || 0,
    
    // Normalize schedule data
    schedule: seminar.schedule || {},
    startDate: seminar.schedule?.startDate || seminar.startDate || '',
    endDate: seminar.schedule?.endDate || seminar.endDate || '',
    meetingTimes: seminar.schedule?.meetingTimes || [],
    timezone: seminar.schedule?.timezone || 'America/New_York',
    
    // For compatibility with simple schema
    date: seminar.date || seminar.schedule?.startDate || '',
    hour: seminar.hour || (seminar.schedule?.meetingTimes?.[0]?.dayOfWeek) || null,
    location: seminar.location || seminar.schedule?.meetingTimes?.[0]?.location || '',
    
    // Additional fields
    image_url: seminar.image_url || '',
    isLocked: seminar.isLocked || false,
    createdAt: seminar.createdAt,
    updatedAt: seminar.updatedAt,
  };
  
  // Calculate availability
  normalized.availableSpots = normalized.capacity - normalized.currentEnrollment;
  normalized.isFull = normalized.currentEnrollment >= normalized.capacity;
  
  return normalized;
};

/**
 * Get all available seminars for browsing
 * @param {Object} filters - Optional filters (date, hour, searchTerm, status)
 * @returns {Promise<Array>} Array of seminar objects
 */
export const getBrowseSeminars = async (filters = {}) => {
  try {
    let seminarsQuery = collection(db, 'seminars');
    const constraints = [];

    // Filter by status (default to active)
    const statusFilter = filters.status || 'active';
    constraints.push(where('status', '==', statusFilter));

    if (constraints.length > 0) {
      seminarsQuery = query(seminarsQuery, ...constraints);
    }

    const seminarsSnapshot = await getDocs(seminarsQuery);
    let seminars = seminarsSnapshot.docs.map(doc => 
      normalizeSeminar({ id: doc.id, ...doc.data() })
    );

    // Client-side filtering for search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      seminars = seminars.filter(seminar => 
        seminar.title?.toLowerCase().includes(searchLower) ||
        seminar.description?.toLowerCase().includes(searchLower) ||
        seminar.teacherName?.toLowerCase().includes(searchLower) ||
        seminar.category?.toLowerCase().includes(searchLower) ||
        seminar.code?.toLowerCase().includes(searchLower)
      );
    }

    // Client-side filtering for date
    if (filters.date) {
      seminars = seminars.filter(seminar => 
        seminar.startDate === filters.date || seminar.date === filters.date
      );
    }

    // Client-side filtering for hour (day of week)
    if (filters.hour) {
      const hourNum = parseInt(filters.hour);
      seminars = seminars.filter(seminar => 
        seminar.hour === hourNum || 
        seminar.meetingTimes?.some(mt => mt.dayOfWeek === hourNum)
      );
    }

    return seminars;
  } catch (error) {
    console.error('Error fetching seminars:', error);
    throw new Error('Failed to load seminars. Please try again.');
  }
};

/**
 * Get student's enrollments with seminar details
 * @param {string} userId - Student user ID
 * @returns {Promise<Array>} Array of enrollment objects with seminar details
 */
export const getStudentEnrollments = async (userId) => {
  try {
    checkRateLimit(userId, 'getEnrollments');
    
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('studentId', '==', userId)
    );
    
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = [];
    
    for (const enrollDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollDoc.data();
      
      // Fetch seminar details
      const seminarRef = doc(db, 'seminars', enrollmentData.seminarId);
      const seminarSnap = await getDoc(seminarRef);
      
      if (seminarSnap.exists()) {
        const seminarData = normalizeSeminar({ id: seminarSnap.id, ...seminarSnap.data() });
        
        enrollments.push({
          id: enrollDoc.id,
          ...enrollmentData,
          seminar: seminarData
        });
      }
    }
    
    await auditLog('view_enrollments', userId, 'enrollments', 'list', {
      count: enrollments.length
    });
    
    return enrollments;
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    throw new Error('Failed to load enrollments. Please try again.');
  }
};

/**
 * Enroll student in a seminar
 * @param {string} seminarId - Seminar ID
 * @param {string} userId - Student user ID
 * @returns {Promise<Object>} Enrollment document
 */
export const enrollInSeminar = async (seminarId, userId) => {
  try {
    checkRateLimit(userId, 'enroll', 5);
    
    // Check if already enrolled
    const existingEnrollmentQuery = query(
      collection(db, 'enrollments'),
      where('studentId', '==', userId),
      where('seminarId', '==', seminarId)
    );
    
    const existingSnapshot = await getDocs(existingEnrollmentQuery);
    if (!existingSnapshot.empty) {
      throw new Error('You are already enrolled in this seminar.');
    }
    
    // Get seminar details
    const seminarRef = doc(db, 'seminars', seminarId);
    const seminarSnap = await getDoc(seminarRef);
    
    if (!seminarSnap.exists()) {
      throw new Error('Seminar not found.');
    }
    
    const seminarData = seminarSnap.data();
    const maxStudents = seminarData.enrollment?.maxStudents || seminarData.capacity || 0;
    const currentCount = seminarData.enrollment?.currentCount || seminarData.currentEnrollment || 0;
    
    // Check capacity
    if (currentCount >= maxStudents) {
      throw new Error('This seminar is full.');
    }
    
    // Check if seminar is locked
    if (seminarData.isLocked) {
      throw new Error('This seminar is locked and not accepting enrollments.');
    }
    
    // Create enrollment
    const enrollment = await addDoc(collection(db, 'enrollments'), {
      studentId: userId,
      seminarId: seminarId,
      status: 'enrolled',
      enrolledAt: serverTimestamp(),
      tenantId: seminarData.tenantId || 'default_tenant'
    });
    
    await auditLog('enroll', userId, 'enrollment', enrollment.id, {
      seminarId,
      seminarTitle: seminarData.title
    });
    
    return { id: enrollment.id, seminarId, userId };
  } catch (error) {
    console.error('Error enrolling in seminar:', error);
    throw error;
  }
};

/**
 * Unenroll student from a seminar
 * @param {string} enrollmentId - Enrollment ID
 * @param {string} userId - Student user ID
 * @returns {Promise<void>}
 */
export const unenrollFromSeminar = async (enrollmentId, userId) => {
  try {
    checkRateLimit(userId, 'unenroll', 5);
    
    // Verify ownership
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    const enrollmentSnap = await getDoc(enrollmentRef);
    
    if (!enrollmentSnap.exists()) {
      throw new Error('Enrollment not found.');
    }
    
    const enrollmentData = enrollmentSnap.data();
    if (enrollmentData.studentId !== userId) {
      throw new Error('Unauthorized: You can only unenroll from your own enrollments.');
    }
    
    await deleteDoc(enrollmentRef);
    
    await auditLog('unenroll', userId, 'enrollment', enrollmentId, {
      seminarId: enrollmentData.seminarId
    });
  } catch (error) {
    console.error('Error unenrolling from seminar:', error);
    throw error;
  }
};

/**
 * Get student's attendance records
 * @param {string} userId - Student user ID
 * @returns {Promise<Array>} Array of attendance records with seminar details
 */
export const getStudentAttendance = async (userId) => {
  try {
    checkRateLimit(userId, 'getAttendance');
    
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceRecords = [];
    
    for (const attendDoc of attendanceSnapshot.docs) {
      const attendanceData = attendDoc.data();
      
      // Fetch seminar details if seminarId exists
      if (attendanceData.seminarId) {
        const seminarRef = doc(db, 'seminars', attendanceData.seminarId);
        const seminarSnap = await getDoc(seminarRef);
        
        if (seminarSnap.exists()) {
          const seminarData = normalizeSeminar({ id: seminarSnap.id, ...seminarSnap.data() });
          
          attendanceRecords.push({
            id: attendDoc.id,
            ...attendanceData,
            seminar: seminarData
          });
        }
      } else {
        attendanceRecords.push({
          id: attendDoc.id,
          ...attendanceData
        });
      }
    }
    
    await auditLog('view_attendance', userId, 'attendance', 'list', {
      count: attendanceRecords.length
    });
    
    return attendanceRecords;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw new Error('Failed to load attendance records. Please try again.');
  }
};

/**
 * Get student's credit information
 * @param {string} userId - Student user ID
 * @returns {Promise<Object>} Credit information object
 */
export const getStudentCredits = async (userId) => {
  try {
    checkRateLimit(userId, 'getCredits');
    
    // Try to get credit record
    const creditsQuery = query(
      collection(db, 'credits'),
      where('studentId', '==', userId),
      limit(1)
    );
    
    const creditsSnapshot = await getDocs(creditsQuery);
    
    let creditsData = {
      studentId: userId,
      totalCredits: 0,
      creditsEarned: 0,
      requiredCredits: 0,
      percentComplete: 0,
      attendanceCount: 0,
      totalSessions: 0,
      seminarCredits: []
    };
    
    if (!creditsSnapshot.empty) {
      const creditDoc = creditsSnapshot.docs[0];
      creditsData = {
        ...creditsData,
        ...creditDoc.data()
      };
    }
    
    // Calculate percentage
    if (creditsData.requiredCredits > 0) {
      creditsData.percentComplete = Math.round(
        (creditsData.creditsEarned / creditsData.requiredCredits) * 100
      );
    }
    
    // Get attendance count
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentId', '==', userId)
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    creditsData.totalSessions = attendanceSnapshot.size;
    creditsData.attendanceCount = attendanceSnapshot.docs.filter(doc => {
      const status = doc.data().status?.toLowerCase();
      return status === 'present' || status === 'attended';
    }).length;
    
    await auditLog('view_credits', userId, 'credits', userId, {
      creditsEarned: creditsData.creditsEarned
    });
    
    return creditsData;
  } catch (error) {
    console.error('Error fetching credits:', error);
    throw new Error('Failed to load credit information. Please try again.');
  }
};

/**
 * Get student's schedule organized by date and hour
 * @param {string} userId - Student user ID
 * @returns {Promise<Object>} Schedule object organized by date
 */
export const getStudentSchedule = async (userId) => {
  try {
    checkRateLimit(userId, 'getSchedule');
    
    const enrollments = await getStudentEnrollments(userId);
    
    // Organize by date
    const schedule = {};
    
    enrollments.forEach(enrollment => {
      const seminar = enrollment.seminar;
      const date = seminar.startDate || seminar.date || 'TBD';
      
      if (!schedule[date]) {
        schedule[date] = [];
      }
      
      // If seminar has meeting times, create entries for each
      if (seminar.meetingTimes && seminar.meetingTimes.length > 0) {
        seminar.meetingTimes.forEach(mt => {
          schedule[date].push({
            ...enrollment,
            hour: mt.dayOfWeek,
            time: `${mt.startTime} - ${mt.endTime}`,
            location: mt.location
          });
        });
      } else {
        schedule[date].push({
          ...enrollment,
          hour: seminar.hour || 0,
          time: 'TBD',
          location: seminar.location || 'TBD'
        });
      }
    });
    
    return schedule;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw new Error('Failed to load schedule. Please try again.');
  }
};

/**
 * Get student profile
 * @param {string} userId - Student user ID
 * @returns {Promise<Object>} Student profile object
 */
export const getStudentProfile = async (userId) => {
  try {
    checkRateLimit(userId, 'getProfile');
    
    const studentRef = doc(db, 'students', userId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      return null;
    }
    
    return {
      id: studentSnap.id,
      ...studentSnap.data()
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw new Error('Failed to load profile. Please try again.');
  }
};

