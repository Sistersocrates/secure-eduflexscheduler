// Comprehensive Specialist Firebase Integration
// Includes all advanced features: intervention plans, progress tracking, communication logs, resource library

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';

// Utility function to get tenant ID (for multi-school support)
const getTenantId = (userId) => {
  // For now, we'll use a default tenant. In production, this would be determined by user's school
  return 'default-tenant';
};

// ==================== SPECIALIST PROFILE MANAGEMENT ====================

export const createSpecialistProfile = async (userId, profileData) => {
  try {
    const tenantId = getTenantId(userId);
    const profileRef = doc(db, 'specialists', userId);
    
    const profile = {
      userId,
      tenantId,
      ...profileData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(profileRef, profile);
    return profile;
  } catch (error) {
    console.error('Error creating specialist profile:', error);
    throw error;
  }
};

export const getSpecialistProfile = async (userId) => {
  try {
    const profileRef = doc(db, 'specialists', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      return { id: profileSnap.id, ...profileSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting specialist profile:', error);
    throw error;
  }
};

export const updateSpecialistProfile = async (userId, updates) => {
  try {
    const profileRef = doc(db, 'specialists', userId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    await updateDoc(profileRef, updateData);
    return updateData;
  } catch (error) {
    console.error('Error updating specialist profile:', error);
    throw error;
  }
};

// ==================== APPOINTMENT MANAGEMENT ====================

export const createAppointment = async (specialistId, appointmentData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const appointmentsRef = collection(db, 'appointments');
    
    const appointment = {
      specialistId,
      tenantId,
      ...appointmentData,
      status: 'scheduled',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(appointmentsRef, appointment);
    return { id: docRef.id, ...appointment };
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

export const getSpecialistAppointments = async (specialistId, filters = {}) => {
  try {
    const tenantId = getTenantId(specialistId);
    const appointmentsRef = collection(db, 'appointments');
    
    let q = query(
      appointmentsRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('scheduledDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting specialist appointments:', error);
    throw error;
  }
};

export const updateAppointment = async (specialistId, appointmentId, updates) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    await updateDoc(appointmentRef, updateData);
    return updateData;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

export const cancelAppointment = async (specialistId, appointmentId, reason = '') => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    const updateData = {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await updateDoc(appointmentRef, updateData);
    return updateData;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

// ==================== AVAILABILITY MANAGEMENT ====================

export const setSpecialistAvailability = async (specialistId, availabilityData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const availabilityRef = collection(db, 'availability');
    
    const availability = {
      specialistId,
      tenantId,
      ...availabilityData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(availabilityRef, availability);
    return { id: docRef.id, ...availability };
  } catch (error) {
    console.error('Error setting specialist availability:', error);
    throw error;
  }
};

export const getSpecialistAvailability = async (specialistId) => {
  try {
    const tenantId = getTenantId(specialistId);
    const availabilityRef = collection(db, 'availability');
    
    const q = query(
      availabilityRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting specialist availability:', error);
    throw error;
  }
};

// ==================== STUDENT NOTES MANAGEMENT ====================

export const createStudentNote = async (specialistId, noteData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const notesRef = collection(db, 'studentNotes');
    
    const note = {
      specialistId,
      tenantId,
      ...noteData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(notesRef, note);
    return { id: docRef.id, ...note };
  } catch (error) {
    console.error('Error creating student note:', error);
    throw error;
  }
};

export const getStudentNotes = async (specialistId, studentId = null) => {
  try {
    const tenantId = getTenantId(specialistId);
    const notesRef = collection(db, 'studentNotes');
    
    let q = query(
      notesRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    if (studentId) {
      q = query(
        notesRef,
        where('specialistId', '==', specialistId),
        where('studentId', '==', studentId),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting student notes:', error);
    throw error;
  }
};

export const updateStudentNote = async (specialistId, noteId, updates) => {
  try {
    const noteRef = doc(db, 'studentNotes', noteId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    await updateDoc(noteRef, updateData);
    return updateData;
  } catch (error) {
    console.error('Error updating student note:', error);
    throw error;
  }
};

export const deleteStudentNote = async (specialistId, noteId) => {
  try {
    const noteRef = doc(db, 'studentNotes', noteId);
    await deleteDoc(noteRef);
    return true;
  } catch (error) {
    console.error('Error deleting student note:', error);
    throw error;
  }
};

// ==================== STUDENT GROUPS MANAGEMENT ====================

export const createStudentGroup = async (specialistId, groupData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const groupsRef = collection(db, 'studentGroups');
    
    const group = {
      specialistId,
      tenantId,
      ...groupData,
      students: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(groupsRef, group);
    return { id: docRef.id, ...group };
  } catch (error) {
    console.error('Error creating student group:', error);
    throw error;
  }
};

export const getSpecialistGroups = async (specialistId) => {
  try {
    const tenantId = getTenantId(specialistId);
    const groupsRef = collection(db, 'studentGroups');
    
    const q = query(
      groupsRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting specialist groups:', error);
    throw error;
  }
};

export const addStudentToGroup = async (specialistId, groupId, studentId) => {
  try {
    const groupRef = doc(db, 'studentGroups', groupId);
    
    await updateDoc(groupRef, {
      students: arrayUnion(studentId),
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error adding student to group:', error);
    throw error;
  }
};

export const removeStudentFromGroup = async (specialistId, groupId, studentId) => {
  try {
    const groupRef = doc(db, 'studentGroups', groupId);
    
    await updateDoc(groupRef, {
      students: arrayRemove(studentId),
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error removing student from group:', error);
    throw error;
  }
};

// ==================== SPECIAL EVENTS MANAGEMENT ====================

export const createSpecialEvent = async (specialistId, eventData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const eventsRef = collection(db, 'specialEvents');
    
    const event = {
      specialistId,
      tenantId,
      ...eventData,
      registrations: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(eventsRef, event);
    return { id: docRef.id, ...event };
  } catch (error) {
    console.error('Error creating special event:', error);
    throw error;
  }
};

export const getSpecialistEvents = async (specialistId) => {
  try {
    const tenantId = getTenantId(specialistId);
    const eventsRef = collection(db, 'specialEvents');
    
    const q = query(
      eventsRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('eventDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting specialist events:', error);
    throw error;
  }
};

export const registerStudentForEvent = async (specialistId, eventId, studentId) => {
  try {
    const eventRef = doc(db, 'specialEvents', eventId);
    
    await updateDoc(eventRef, {
      registrations: arrayUnion(studentId),
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error registering student for event:', error);
    throw error;
  }
};

export const updateEventRegistration = async (specialistId, eventId, registrationData) => {
  try {
    const eventRef = doc(db, 'specialEvents', eventId);
    
    await updateDoc(eventRef, {
      ...registrationData,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error updating event registration:', error);
    throw error;
  }
};

// ==================== STUDENT SCHEDULE MANAGEMENT ====================

export const getStudentSchedule = async (specialistId, studentId) => {
  try {
    const tenantId = getTenantId(specialistId);
    
    // Get appointments for the student
    const appointmentsRef = collection(db, 'appointments');
    const appointmentsQuery = query(
      appointmentsRef,
      where('studentId', '==', studentId),
      where('tenantId', '==', tenantId),
      orderBy('scheduledDate', 'asc')
    );

    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'appointment',
      ...doc.data()
    }));

    return appointments;
  } catch (error) {
    console.error('Error getting student schedule:', error);
    throw error;
  }
};

// ==================== SEARCH AND UTILITY FUNCTIONS ====================

export const searchStudents = async (specialistId, searchTerm) => {
  try {
    const tenantId = getTenantId(specialistId);
    const usersRef = collection(db, 'users');
    
    const q = query(
      usersRef,
      where('tenantId', '==', tenantId),
      where('role', '==', 'student'),
      orderBy('displayName')
    );

    const querySnapshot = await getDocs(q);
    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by search term (client-side filtering for simplicity)
    if (searchTerm) {
      return students.filter(student => 
        student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return students;
  } catch (error) {
    console.error('Error searching students:', error);
    throw error;
  }
};

export const getSpecialistStats = async (specialistId) => {
  try {
    const tenantId = getTenantId(specialistId);
    
    // Get various counts
    const [
      appointmentsSnapshot,
      notesSnapshot,
      plansSnapshot
    ] = await Promise.all([
      getDocs(query(
        collection(db, 'appointments'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId)
      )),
      getDocs(query(
        collection(db, 'studentNotes'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId)
      )),
      getDocs(query(
        collection(db, 'interventionPlans'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId)
      ))
    ]);

    return {
      totalAppointments: appointmentsSnapshot.size,
      totalNotes: notesSnapshot.size,
      totalPlans: plansSnapshot.size,
      activeStudents: new Set([
        ...appointmentsSnapshot.docs.map(doc => doc.data().studentId),
        ...notesSnapshot.docs.map(doc => doc.data().studentId)
      ]).size
    };
  } catch (error) {
    console.error('Error getting specialist stats:', error);
    throw error;
  }
};

// ==================== INTERVENTION PLANS ====================

export const createInterventionPlan = async (specialistId, planData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const plansRef = collection(db, 'interventionPlans');
    
    const plan = {
      specialistId,
      studentId: planData.studentId,
      tenantId,
      title: planData.title,
      description: planData.description,
      goals: planData.goals || [],
      strategies: planData.strategies || [],
      timeline: planData.timeline || {},
      priority: planData.priority || 'medium',
      status: 'active',
      authorizedTeachers: planData.authorizedTeachers || [],
      parentNotified: planData.parentNotified || false,
      reviewDate: planData.reviewDate ? Timestamp.fromDate(new Date(planData.reviewDate)) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(plansRef, plan);
    
    // Create audit log
    await createAuditLog(specialistId, 'intervention_plan_created', {
      planId: docRef.id,
      studentId: planData.studentId,
      priority: plan.priority
    });

    return { id: docRef.id, ...plan };
  } catch (error) {
    console.error('Error creating intervention plan:', error);
    throw error;
  }
};

export const getInterventionPlans = async (specialistId, studentId = null) => {
  try {
    const tenantId = getTenantId(specialistId);
    const plansRef = collection(db, 'interventionPlans');
    
    let q = query(
      plansRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    if (studentId) {
      q = query(
        plansRef,
        where('specialistId', '==', specialistId),
        where('studentId', '==', studentId),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting intervention plans:', error);
    throw error;
  }
};

export const updateInterventionPlan = async (specialistId, planId, updates) => {
  try {
    const planRef = doc(db, 'interventionPlans', planId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    await updateDoc(planRef, updateData);
    
    // Create audit log
    await createAuditLog(specialistId, 'intervention_plan_updated', {
      planId,
      updates: Object.keys(updates)
    });

    return { id: planId, ...updateData };
  } catch (error) {
    console.error('Error updating intervention plan:', error);
    throw error;
  }
};

// ==================== PROGRESS TRACKING ====================

export const createProgressEntry = async (specialistId, progressData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const progressRef = collection(db, 'progressTracking');
    
    const entry = {
      specialistId,
      studentId: progressData.studentId,
      planId: progressData.planId,
      tenantId,
      goalId: progressData.goalId,
      progressType: progressData.progressType, // 'academic', 'behavioral', 'social', 'emotional'
      measurement: progressData.measurement,
      value: progressData.value,
      notes: progressData.notes || '',
      attachments: progressData.attachments || [],
      date: progressData.date ? Timestamp.fromDate(new Date(progressData.date)) : Timestamp.now(),
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(progressRef, entry);
    
    // Create audit log
    await createAuditLog(specialistId, 'progress_entry_created', {
      entryId: docRef.id,
      studentId: progressData.studentId,
      progressType: entry.progressType
    });

    return { id: docRef.id, ...entry };
  } catch (error) {
    console.error('Error creating progress entry:', error);
    throw error;
  }
};

export const getProgressTracking = async (specialistId, studentId = null, planId = null) => {
  try {
    const tenantId = getTenantId(specialistId);
    const progressRef = collection(db, 'progressTracking');
    
    let q = query(
      progressRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('date', 'desc')
    );

    if (studentId) {
      q = query(
        progressRef,
        where('specialistId', '==', specialistId),
        where('studentId', '==', studentId),
        where('tenantId', '==', tenantId),
        orderBy('date', 'desc')
      );
    }

    if (planId) {
      q = query(
        progressRef,
        where('specialistId', '==', specialistId),
        where('planId', '==', planId),
        where('tenantId', '==', tenantId),
        orderBy('date', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting progress tracking:', error);
    throw error;
  }
};

// ==================== COMMUNICATION LOGS ====================

export const createCommunicationLog = async (specialistId, communicationData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const communicationRef = collection(db, 'communicationLogs');
    
    const log = {
      specialistId,
      studentId: communicationData.studentId,
      tenantId,
      communicationType: communicationData.communicationType, // 'email', 'phone', 'meeting', 'note'
      participants: communicationData.participants || [],
      subject: communicationData.subject,
      content: communicationData.content,
      attachments: communicationData.attachments || [],
      followUpRequired: communicationData.followUpRequired || false,
      followUpDate: communicationData.followUpDate ? Timestamp.fromDate(new Date(communicationData.followUpDate)) : null,
      confidential: communicationData.confidential || false,
      tags: communicationData.tags || [],
      date: communicationData.date ? Timestamp.fromDate(new Date(communicationData.date)) : Timestamp.now(),
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(communicationRef, log);
    
    // Create audit log
    await createAuditLog(specialistId, 'communication_log_created', {
      logId: docRef.id,
      studentId: communicationData.studentId,
      communicationType: log.communicationType
    });

    return { id: docRef.id, ...log };
  } catch (error) {
    console.error('Error creating communication log:', error);
    throw error;
  }
};

export const getCommunicationLogs = async (specialistId, studentId = null) => {
  try {
    const tenantId = getTenantId(specialistId);
    const communicationRef = collection(db, 'communicationLogs');
    
    let q = query(
      communicationRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('date', 'desc')
    );

    if (studentId) {
      q = query(
        communicationRef,
        where('specialistId', '==', specialistId),
        where('studentId', '==', studentId),
        where('tenantId', '==', tenantId),
        orderBy('date', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting communication logs:', error);
    throw error;
  }
};

// ==================== RESOURCE LIBRARY ====================

export const uploadResource = async (specialistId, file, resourceData) => {
  try {
    const tenantId = getTenantId(specialistId);
    
    // Upload file to Firebase Storage
    const fileRef = ref(storage, `resources/${tenantId}/${specialistId}/${Date.now()}_${file.name}`);
    const uploadResult = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Save resource metadata to Firestore
    const resourcesRef = collection(db, 'resourceLibrary');
    const resource = {
      specialistId,
      tenantId,
      title: resourceData.title,
      description: resourceData.description || '',
      category: resourceData.category,
      tags: resourceData.tags || [],
      fileUrl: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      accessLevel: resourceData.accessLevel || 'private', // 'private', 'team', 'public'
      sharedWith: resourceData.sharedWith || [],
      downloadCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(resourcesRef, resource);
    
    // Create audit log
    await createAuditLog(specialistId, 'resource_uploaded', {
      resourceId: docRef.id,
      fileName: file.name,
      category: resource.category
    });

    return { id: docRef.id, ...resource };
  } catch (error) {
    console.error('Error uploading resource:', error);
    throw error;
  }
};

export const getResourceLibrary = async (specialistId, category = null) => {
  try {
    const tenantId = getTenantId(specialistId);
    const resourcesRef = collection(db, 'resourceLibrary');
    
    let q = query(
      resourcesRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    if (category) {
      q = query(
        resourcesRef,
        where('tenantId', '==', tenantId),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting resource library:', error);
    throw error;
  }
};

export const downloadResource = async (specialistId, resourceId) => {
  try {
    const resourceRef = doc(db, 'resourceLibrary', resourceId);
    
    // Increment download count
    await updateDoc(resourceRef, {
      downloadCount: increment(1)
    });
    
    // Create audit log
    await createAuditLog(specialistId, 'resource_downloaded', {
      resourceId
    });

    return true;
  } catch (error) {
    console.error('Error downloading resource:', error);
    throw error;
  }
};

// ==================== APPOINTMENT REQUESTS ====================

export const createAppointmentRequest = async (studentId, requestData) => {
  try {
    const tenantId = getTenantId(studentId);
    const requestsRef = collection(db, 'appointmentRequests');
    
    const request = {
      studentId,
      specialistId: requestData.specialistId,
      tenantId,
      requestType: requestData.requestType, // 'consultation', 'assessment', 'follow-up'
      priority: requestData.priority || 'normal',
      preferredDates: requestData.preferredDates || [],
      reason: requestData.reason,
      notes: requestData.notes || '',
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(requestsRef, request);
    return { id: docRef.id, ...request };
  } catch (error) {
    console.error('Error creating appointment request:', error);
    throw error;
  }
};

export const getAppointmentRequests = async (specialistId, status = null) => {
  try {
    const tenantId = getTenantId(specialistId);
    const requestsRef = collection(db, 'appointmentRequests');
    
    let q = query(
      requestsRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(
        requestsRef,
        where('specialistId', '==', specialistId),
        where('status', '==', status),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting appointment requests:', error);
    throw error;
  }
};

export const respondToAppointmentRequest = async (specialistId, requestId, response) => {
  try {
    const requestRef = doc(db, 'appointmentRequests', requestId);
    
    const updateData = {
      status: response.status, // 'approved', 'rejected', 'rescheduled'
      response: response.message || '',
      scheduledDate: response.scheduledDate ? Timestamp.fromDate(new Date(response.scheduledDate)) : null,
      updatedAt: Timestamp.now()
    };

    await updateDoc(requestRef, updateData);
    
    // Create audit log
    await createAuditLog(specialistId, 'appointment_request_responded', {
      requestId,
      status: response.status
    });

    return { id: requestId, ...updateData };
  } catch (error) {
    console.error('Error responding to appointment request:', error);
    throw error;
  }
};

// ==================== CRISIS MANAGEMENT ====================

export const createCrisisAlert = async (specialistId, alertData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const alertsRef = collection(db, 'crisisAlerts');
    
    const alert = {
      specialistId,
      studentId: alertData.studentId,
      tenantId,
      alertType: alertData.alertType, // 'safety', 'mental_health', 'behavioral', 'academic'
      severity: alertData.severity, // 'low', 'medium', 'high', 'critical'
      description: alertData.description,
      immediateActions: alertData.immediateActions || [],
      notifiedParties: alertData.notifiedParties || [],
      followUpRequired: alertData.followUpRequired || true,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(alertsRef, alert);
    
    // Create audit log
    await createAuditLog(specialistId, 'crisis_alert_created', {
      alertId: docRef.id,
      studentId: alertData.studentId,
      severity: alert.severity
    });

    return { id: docRef.id, ...alert };
  } catch (error) {
    console.error('Error creating crisis alert:', error);
    throw error;
  }
};

// ==================== ANALYTICS ====================

export const getSpecialistAnalytics = async (specialistId, timeframe = 'month') => {
  try {
    const tenantId = getTenantId(specialistId);
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startTimestamp = Timestamp.fromDate(startDate);

    // Get various analytics data
    const [
      interventionPlans,
      progressEntries,
      communicationLogs,
      appointmentRequests,
      crisisAlerts
    ] = await Promise.all([
      getDocs(query(
        collection(db, 'interventionPlans'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', startTimestamp)
      )),
      getDocs(query(
        collection(db, 'progressTracking'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', startTimestamp)
      )),
      getDocs(query(
        collection(db, 'communicationLogs'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', startTimestamp)
      )),
      getDocs(query(
        collection(db, 'appointmentRequests'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', startTimestamp)
      )),
      getDocs(query(
        collection(db, 'crisisAlerts'),
        where('specialistId', '==', specialistId),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', startTimestamp)
      ))
    ]);

    return {
      timeframe,
      totalInterventionPlans: interventionPlans.size,
      totalProgressEntries: progressEntries.size,
      totalCommunications: communicationLogs.size,
      totalAppointmentRequests: appointmentRequests.size,
      totalCrisisAlerts: crisisAlerts.size,
      activeStudents: new Set([
        ...interventionPlans.docs.map(doc => doc.data().studentId),
        ...progressEntries.docs.map(doc => doc.data().studentId)
      ]).size
    };
  } catch (error) {
    console.error('Error getting specialist analytics:', error);
    throw error;
  }
};

// ==================== AUDIT LOGGING ====================

const createAuditLog = async (userId, action, details = {}) => {
  try {
    const tenantId = getTenantId(userId);
    const auditRef = collection(db, 'auditLogs');
    
    const auditLog = {
      userId,
      tenantId,
      action,
      details,
      timestamp: Timestamp.now(),
      userAgent: navigator.userAgent || 'Unknown',
      ipAddress: 'Unknown' // Would need server-side implementation for real IP
    };

    await addDoc(auditRef, auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error for audit logging failures
  }
};

// Export all functions
export {
  createAuditLog
};

