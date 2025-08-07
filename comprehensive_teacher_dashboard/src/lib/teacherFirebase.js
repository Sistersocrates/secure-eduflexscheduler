import { 
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
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, createAuditLog } from './firebase';

// Class Management Functions
export const createClass = async (teacherId, classData) => {
  try {
    const classDoc = {
      teacherId,
      title: classData.title,
      description: classData.description,
      imageUrl: classData.imageUrl || '',
      room: classData.room || '',
      capacity: parseInt(classData.capacity) || 20,
      hour: parseInt(classData.hour),
      availableDays: classData.availableDays || [],
      startDate: classData.startDate ? Timestamp.fromDate(new Date(classData.startDate)) : null,
      endDate: classData.endDate ? Timestamp.fromDate(new Date(classData.endDate)) : null,
      enrollmentStart: classData.enrollmentStart ? Timestamp.fromDate(new Date(classData.enrollmentStart)) : null,
      enrollmentEnd: classData.enrollmentEnd ? Timestamp.fromDate(new Date(classData.enrollmentEnd)) : null,
      category: classData.category || 'general',
      prerequisites: classData.prerequisites || [],
      learningGoals: classData.learningGoals || [],
      materials: classData.materials || [],
      status: 'published',
      currentEnrollment: 0,
      waitlistCount: 0,
      teacherName: classData.teacherName || '',
      teacherEmail: classData.teacherEmail || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const classRef = await addDoc(collection(db, 'classes'), classDoc);
    
    // Create audit log
    await createAuditLog(teacherId, 'class_created', 'classes', classRef.id, {
      title: classData.title,
      hour: classData.hour,
      capacity: classData.capacity
    });

    return { id: classRef.id, ...classDoc };
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

export const updateClass = async (teacherId, classId, updateData) => {
  try {
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only update your own classes');
    }

    const updatedData = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    // Handle date conversions
    if (updateData.startDate) {
      updatedData.startDate = Timestamp.fromDate(new Date(updateData.startDate));
    }
    if (updateData.endDate) {
      updatedData.endDate = Timestamp.fromDate(new Date(updateData.endDate));
    }
    if (updateData.enrollmentStart) {
      updatedData.enrollmentStart = Timestamp.fromDate(new Date(updateData.enrollmentStart));
    }
    if (updateData.enrollmentEnd) {
      updatedData.enrollmentEnd = Timestamp.fromDate(new Date(updateData.enrollmentEnd));
    }

    await updateDoc(classRef, updatedData);
    
    // Create audit log
    await createAuditLog(teacherId, 'class_updated', 'classes', classId, updateData);

    return { id: classId, ...classData, ...updatedData };
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

export const deleteClass = async (teacherId, classId, archive = true) => {
  try {
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only delete your own classes');
    }

    if (archive) {
      await updateDoc(classRef, {
        status: 'archived',
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await createAuditLog(teacherId, 'class_archived', 'classes', classId, {
        title: classData.title
      });
    } else {
      await deleteDoc(classRef);
      
      await createAuditLog(teacherId, 'class_deleted', 'classes', classId, {
        title: classData.title
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

export const getTeacherClasses = async (teacherId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'classes'),
      where('teacherId', '==', teacherId)
    );

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    } else {
      q = query(q, where('status', 'in', ['published', 'draft']));
    }

    if (filters.hour) {
      q = query(q, where('hour', '==', parseInt(filters.hour)));
    }

    q = query(q, orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const classes = [];

    querySnapshot.forEach((doc) => {
      const classData = { id: doc.id, ...doc.data() };
      
      // Convert Firestore timestamps to JavaScript dates
      if (classData.startDate) {
        classData.startDate = classData.startDate.toDate();
      }
      if (classData.endDate) {
        classData.endDate = classData.endDate.toDate();
      }
      if (classData.enrollmentStart) {
        classData.enrollmentStart = classData.enrollmentStart.toDate();
      }
      if (classData.enrollmentEnd) {
        classData.enrollmentEnd = classData.enrollmentEnd.toDate();
      }
      
      classes.push(classData);
    });

    return classes;
  } catch (error) {
    console.error('Error getting teacher classes:', error);
    throw error;
  }
};

export const cloneClass = async (teacherId, classId, newTitle) => {
  try {
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const originalClass = classSnap.data();
    if (originalClass.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only clone your own classes');
    }

    const clonedClass = {
      ...originalClass,
      title: newTitle,
      status: 'draft',
      currentEnrollment: 0,
      waitlistCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Remove fields that shouldn't be cloned
    delete clonedClass.id;

    const newClassRef = await addDoc(collection(db, 'classes'), clonedClass);
    
    await createAuditLog(teacherId, 'class_cloned', 'classes', newClassRef.id, {
      originalClassId: classId,
      originalTitle: originalClass.title,
      newTitle: newTitle
    });

    return { id: newClassRef.id, ...clonedClass };
  } catch (error) {
    console.error('Error cloning class:', error);
    throw error;
  }
};

// Class Image Management
export const uploadClassImage = async (classId, imageFile) => {
  try {
    const imageRef = ref(storage, `class-images/${classId}/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update class with new image URL
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      imageUrl: downloadURL,
      updatedAt: serverTimestamp()
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading class image:', error);
    throw error;
  }
};

export const deleteClassImage = async (classId, imageUrl) => {
  try {
    // Delete from storage
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    
    // Update class to remove image URL
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      imageUrl: '',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting class image:', error);
    throw error;
  }
};

// Roster Management Functions
export const getClassRoster = async (teacherId, classId) => {
  try {
    // Verify teacher owns the class
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only view rosters for your own classes');
    }

    // Get enrolled students
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('classId', '==', classId),
      where('status', '==', 'enrolled'),
      orderBy('enrollmentDate', 'asc')
    );

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const roster = [];

    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = { id: doc.id, ...doc.data() };
      
      // Get student details
      const studentRef = doc(db, 'users', enrollment.studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        roster.push({
          ...enrollment,
          student: {
            id: studentSnap.id,
            displayName: studentData.displayName,
            email: studentData.email,
            studentId: studentData.studentId,
            gradeLevel: studentData.gradeLevel,
            photoURL: studentData.photoURL
          }
        });
      }
    }

    return roster;
  } catch (error) {
    console.error('Error getting class roster:', error);
    throw error;
  }
};

export const getClassWaitlist = async (teacherId, classId) => {
  try {
    // Verify teacher owns the class
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only view waitlists for your own classes');
    }

    // Get waitlisted students
    const waitlistQuery = query(
      collection(db, 'enrollments'),
      where('classId', '==', classId),
      where('status', '==', 'waitlisted'),
      orderBy('enrollmentDate', 'asc')
    );

    const waitlistSnapshot = await getDocs(waitlistQuery);
    const waitlist = [];

    for (const doc of waitlistSnapshot.docs) {
      const enrollment = { id: doc.id, ...doc.data() };
      
      // Get student details
      const studentRef = doc(db, 'users', enrollment.studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        waitlist.push({
          ...enrollment,
          student: {
            id: studentSnap.id,
            displayName: studentData.displayName,
            email: studentData.email,
            studentId: studentData.studentId,
            gradeLevel: studentData.gradeLevel,
            photoURL: studentData.photoURL
          }
        });
      }
    }

    return waitlist;
  } catch (error) {
    console.error('Error getting class waitlist:', error);
    throw error;
  }
};

export const approveWaitlistStudent = async (teacherId, classId, enrollmentId) => {
  try {
    // Verify teacher owns the class
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only manage your own classes');
    }

    // Check if class has capacity
    if (classData.currentEnrollment >= classData.capacity) {
      throw new Error('Class is at full capacity');
    }

    const batch = writeBatch(db);

    // Update enrollment status
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    batch.update(enrollmentRef, {
      status: 'enrolled',
      approvedAt: serverTimestamp(),
      approvedBy: teacherId,
      waitlistPosition: null
    });

    // Update class enrollment count
    batch.update(classRef, {
      currentEnrollment: increment(1),
      waitlistCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    // Get enrollment details for audit log
    const enrollmentSnap = await getDoc(enrollmentRef);
    const enrollmentData = enrollmentSnap.data();

    // Create audit log
    await createAuditLog(teacherId, 'waitlist_approved', 'enrollments', enrollmentId, {
      classId,
      studentId: enrollmentData.studentId,
      classTitle: classData.title
    });

    // Create notification for student
    await createNotification({
      userId: enrollmentData.studentId,
      title: 'Waitlist Approved!',
      message: `You have been enrolled in ${classData.title}`,
      type: 'enrollment',
      data: { classId, enrollmentId }
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving waitlist student:', error);
    throw error;
  }
};

// Attendance Management Functions
export const recordAttendance = async (teacherId, classId, attendanceData) => {
  try {
    // Verify teacher owns the class
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only record attendance for your own classes');
    }

    const batch = writeBatch(db);
    const attendanceRecords = [];

    for (const record of attendanceData.records) {
      const attendanceDoc = {
        classId,
        studentId: record.studentId,
        date: Timestamp.fromDate(new Date(attendanceData.date)),
        status: record.status, // 'present', 'absent', 'late', 'excused'
        notes: record.notes || '',
        creditAwarded: calculateCredit(record.status),
        recordedBy: teacherId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const attendanceRef = doc(collection(db, 'attendance'));
      batch.set(attendanceRef, attendanceDoc);
      
      attendanceRecords.push({ id: attendanceRef.id, ...attendanceDoc });

      // Update student credits if present
      if (record.status === 'present') {
        const creditDoc = {
          studentId: record.studentId,
          classId,
          creditType: 'attendance',
          creditAmount: attendanceDoc.creditAwarded,
          earnedDate: attendanceDoc.date,
          description: `Attendance credit for ${classData.title}`,
          awardedBy: teacherId,
          createdAt: serverTimestamp()
        };

        const creditRef = doc(collection(db, 'credits'));
        batch.set(creditRef, creditDoc);
      }
    }

    await batch.commit();

    // Create audit log
    await createAuditLog(teacherId, 'attendance_recorded', 'attendance', classId, {
      date: attendanceData.date,
      recordCount: attendanceData.records.length,
      classTitle: classData.title
    });

    return attendanceRecords;
  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
};

export const getClassAttendance = async (teacherId, classId, filters = {}) => {
  try {
    // Verify teacher owns the class
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only view attendance for your own classes');
    }

    let q = query(
      collection(db, 'attendance'),
      where('classId', '==', classId)
    );

    if (filters.date) {
      const date = Timestamp.fromDate(new Date(filters.date));
      q = query(q, where('date', '==', date));
    }

    if (filters.dateRange) {
      const startDate = Timestamp.fromDate(new Date(filters.dateRange.start));
      const endDate = Timestamp.fromDate(new Date(filters.dateRange.end));
      q = query(q, where('date', '>=', startDate), where('date', '<=', endDate));
    }

    if (filters.studentId) {
      q = query(q, where('studentId', '==', filters.studentId));
    }

    q = query(q, orderBy('date', 'desc'));

    const querySnapshot = await getDocs(q);
    const attendance = [];

    for (const doc of querySnapshot.docs) {
      const attendanceData = { id: doc.id, ...doc.data() };
      
      // Convert timestamp to date
      if (attendanceData.date) {
        attendanceData.date = attendanceData.date.toDate();
      }

      // Get student details
      const studentRef = doc(db, 'users', attendanceData.studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        attendanceData.student = {
          id: studentSnap.id,
          displayName: studentData.displayName,
          email: studentData.email,
          studentId: studentData.studentId,
          photoURL: studentData.photoURL
        };
      }

      attendance.push(attendanceData);
    }

    return attendance;
  } catch (error) {
    console.error('Error getting class attendance:', error);
    throw error;
  }
};

export const updateAttendanceRecord = async (teacherId, attendanceId, updateData) => {
  try {
    const attendanceRef = doc(db, 'attendance', attendanceId);
    const attendanceSnap = await getDoc(attendanceRef);
    
    if (!attendanceSnap.exists()) {
      throw new Error('Attendance record not found');
    }
    
    const attendanceData = attendanceSnap.data();
    
    // Verify teacher owns the class
    const classRef = doc(db, 'classes', attendanceData.classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }
    
    const classData = classSnap.data();
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only update attendance for your own classes');
    }

    const updatedData = {
      ...updateData,
      creditAwarded: calculateCredit(updateData.status || attendanceData.status),
      updatedAt: serverTimestamp()
    };

    await updateDoc(attendanceRef, updatedData);

    // Create audit log
    await createAuditLog(teacherId, 'attendance_updated', 'attendance', attendanceId, {
      classId: attendanceData.classId,
      studentId: attendanceData.studentId,
      oldStatus: attendanceData.status,
      newStatus: updateData.status
    });

    return { id: attendanceId, ...attendanceData, ...updatedData };
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

// Resource Request Functions
export const createResourceRequest = async (teacherId, requestData) => {
  try {
    const resourceRequest = {
      teacherId,
      classId: requestData.classId || null,
      type: requestData.type, // 'transportation', 'funding', 'space', 'equipment'
      title: requestData.title,
      description: requestData.description,
      amount: requestData.amount || null,
      neededByDate: requestData.neededByDate ? Timestamp.fromDate(new Date(requestData.neededByDate)) : null,
      priority: requestData.priority || 'medium',
      status: 'submitted',
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const requestRef = await addDoc(collection(db, 'resourceRequests'), resourceRequest);
    
    // Create audit log
    await createAuditLog(teacherId, 'resource_request_created', 'resourceRequests', requestRef.id, {
      type: requestData.type,
      title: requestData.title,
      amount: requestData.amount
    });

    return { id: requestRef.id, ...resourceRequest };
  } catch (error) {
    console.error('Error creating resource request:', error);
    throw error;
  }
};

export const getTeacherResourceRequests = async (teacherId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'resourceRequests'),
      where('teacherId', '==', teacherId)
    );

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const requests = [];

    querySnapshot.forEach((doc) => {
      const requestData = { id: doc.id, ...doc.data() };
      
      // Convert timestamps
      if (requestData.neededByDate) {
        requestData.neededByDate = requestData.neededByDate.toDate();
      }
      if (requestData.submittedAt) {
        requestData.submittedAt = requestData.submittedAt.toDate();
      }
      
      requests.push(requestData);
    });

    return requests;
  } catch (error) {
    console.error('Error getting teacher resource requests:', error);
    throw error;
  }
};

// AI-Assisted Content Functions
export const generateClassDescription = async (title, keywords = []) => {
  try {
    const response = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, keywords }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate description');
    }

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error('Error generating class description:', error);
    throw error;
  }
};

export const analyzeAttendancePatterns = async (classId) => {
  try {
    const response = await fetch('/api/ai/analyze-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ classId }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze attendance');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing attendance patterns:', error);
    throw error;
  }
};

// Utility Functions
const calculateCredit = (status) => {
  switch (status) {
    case 'present':
      return 1.0;
    case 'late':
      return 0.8;
    case 'excused':
      return 0.5;
    case 'absent':
    default:
      return 0.0;
  }
};

// Real-time listeners
export const subscribeToTeacherClasses = (teacherId, callback) => {
  const q = query(
    collection(db, 'classes'),
    where('teacherId', '==', teacherId),
    where('status', 'in', ['published', 'draft']),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, callback);
};

export const subscribeToClassRoster = (classId, callback) => {
  const q = query(
    collection(db, 'enrollments'),
    where('classId', '==', classId),
    orderBy('enrollmentDate', 'asc')
  );
  
  return onSnapshot(q, callback);
};

export const subscribeToResourceRequests = (teacherId, callback) => {
  const q = query(
    collection(db, 'resourceRequests'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, callback);
};

