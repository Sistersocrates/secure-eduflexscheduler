// Enhanced Specialist Firebase Implementation
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
    const plans = [];
    
    for (const doc of querySnapshot.docs) {
      const planData = { id: doc.id, ...doc.data() };
      
      // Get student information
      if (planData.studentId) {
        const studentDoc = await getDoc(doc(db, 'users', planData.studentId));
        if (studentDoc.exists()) {
          planData.student = { id: studentDoc.id, ...studentDoc.data() };
        }
      }
      
      plans.push(planData);
    }

    return plans;
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
    
    if (updates.reviewDate) {
      updateData.reviewDate = Timestamp.fromDate(new Date(updates.reviewDate));
    }

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
    
    const progress = {
      specialistId,
      studentId: progressData.studentId,
      tenantId,
      interventionPlanId: progressData.interventionPlanId || null,
      goalId: progressData.goalId || null,
      title: progressData.title,
      description: progressData.description,
      progressType: progressData.progressType || 'behavioral', // behavioral, academic, social, emotional
      rating: progressData.rating || null, // 1-5 scale
      metrics: progressData.metrics || {},
      observations: progressData.observations || '',
      nextSteps: progressData.nextSteps || '',
      attachments: progressData.attachments || [],
      isConfidential: progressData.isConfidential || false,
      authorizedTeachers: progressData.authorizedTeachers || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(progressRef, progress);
    
    // Create audit log
    await createAuditLog(specialistId, 'progress_entry_created', {
      progressId: docRef.id,
      studentId: progressData.studentId,
      progressType: progress.progressType
    });

    return { id: docRef.id, ...progress };
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
      orderBy('createdAt', 'desc')
    );

    if (studentId) {
      q = query(
        progressRef,
        where('specialistId', '==', specialistId),
        where('studentId', '==', studentId),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
    }

    if (planId) {
      q = query(
        progressRef,
        where('specialistId', '==', specialistId),
        where('interventionPlanId', '==', planId),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const progressEntries = [];
    
    for (const doc of querySnapshot.docs) {
      const progressData = { id: doc.id, ...doc.data() };
      
      // Get student information
      if (progressData.studentId) {
        const studentDoc = await getDoc(doc(db, 'users', progressData.studentId));
        if (studentDoc.exists()) {
          progressData.student = { id: studentDoc.id, ...studentDoc.data() };
        }
      }
      
      progressEntries.push(progressData);
    }

    return progressEntries;
  } catch (error) {
    console.error('Error getting progress tracking:', error);
    throw error;
  }
};

// ==================== COMMUNICATION LOGS ====================

export const createCommunicationLog = async (specialistId, communicationData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const logsRef = collection(db, 'communicationLogs');
    
    const log = {
      specialistId,
      studentId: communicationData.studentId,
      tenantId,
      communicationType: communicationData.communicationType, // email, phone, in_person, parent_contact
      subject: communicationData.subject,
      content: communicationData.content,
      participants: communicationData.participants || [],
      outcome: communicationData.outcome || '',
      followUpRequired: communicationData.followUpRequired || false,
      followUpDate: communicationData.followUpDate ? Timestamp.fromDate(new Date(communicationData.followUpDate)) : null,
      attachments: communicationData.attachments || [],
      isConfidential: communicationData.isConfidential || false,
      parentInvolved: communicationData.parentInvolved || false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(logsRef, log);
    
    // Create audit log
    await createAuditLog(specialistId, 'communication_logged', {
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
    const logsRef = collection(db, 'communicationLogs');
    
    let q = query(
      logsRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    if (studentId) {
      q = query(
        logsRef,
        where('specialistId', '==', specialistId),
        where('studentId', '==', studentId),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const logs = [];
    
    for (const doc of querySnapshot.docs) {
      const logData = { id: doc.id, ...doc.data() };
      
      // Get student information
      if (logData.studentId) {
        const studentDoc = await getDoc(doc(db, 'users', logData.studentId));
        if (studentDoc.exists()) {
          logData.student = { id: studentDoc.id, ...studentDoc.data() };
        }
      }
      
      logs.push(logData);
    }

    return logs;
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
    const fileRef = ref(storage, `resource-library/${tenantId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Create resource document
    const resourcesRef = collection(db, 'resourceLibrary');
    const resource = {
      uploadedBy: specialistId,
      tenantId,
      title: resourceData.title,
      description: resourceData.description || '',
      category: resourceData.category || 'general',
      tags: resourceData.tags || [],
      fileUrl: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      isPublic: resourceData.isPublic || false,
      accessLevel: resourceData.accessLevel || 'specialist', // specialist, teacher, student, public
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
    const resources = [];
    
    for (const doc of querySnapshot.docs) {
      const resourceData = { id: doc.id, ...doc.data() };
      
      // Get uploader information
      if (resourceData.uploadedBy) {
        const uploaderDoc = await getDoc(doc(db, 'users', resourceData.uploadedBy));
        if (uploaderDoc.exists()) {
          resourceData.uploader = { id: uploaderDoc.id, ...uploaderDoc.data() };
        }
      }
      
      resources.push(resourceData);
    }

    return resources;
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
      requestedDate: Timestamp.fromDate(new Date(requestData.requestedDate)),
      requestedTime: requestData.requestedTime,
      alternativeDates: requestData.alternativeDates || [],
      reason: requestData.reason,
      urgency: requestData.urgency || 'normal', // low, normal, high, urgent
      status: 'pending',
      specialistResponse: null,
      responseDate: null,
      scheduledAppointmentId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(requestsRef, request);
    
    // Create audit log
    await createAuditLog(studentId, 'appointment_request_created', {
      requestId: docRef.id,
      specialistId: requestData.specialistId,
      urgency: request.urgency
    });

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
    const requests = [];
    
    for (const doc of querySnapshot.docs) {
      const requestData = { id: doc.id, ...doc.data() };
      
      // Get student information
      if (requestData.studentId) {
        const studentDoc = await getDoc(doc(db, 'users', requestData.studentId));
        if (studentDoc.exists()) {
          requestData.student = { id: studentDoc.id, ...studentDoc.data() };
        }
      }
      
      requests.push(requestData);
    }

    return requests;
  } catch (error) {
    console.error('Error getting appointment requests:', error);
    throw error;
  }
};

export const respondToAppointmentRequest = async (specialistId, requestId, response) => {
  try {
    const requestRef = doc(db, 'appointmentRequests', requestId);
    const updateData = {
      status: response.status, // approved, denied, needs_modification
      specialistResponse: response.message,
      responseDate: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    if (response.status === 'approved' && response.appointmentData) {
      // Create the actual appointment
      const appointment = await createAppointment(specialistId, response.appointmentData);
      updateData.scheduledAppointmentId = appointment.id;
    }

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

// ==================== CRISIS INTERVENTION ====================

export const createCrisisAlert = async (specialistId, alertData) => {
  try {
    const tenantId = getTenantId(specialistId);
    const alertsRef = collection(db, 'crisisAlerts');
    
    const alert = {
      specialistId,
      studentId: alertData.studentId,
      tenantId,
      alertType: alertData.alertType, // safety, mental_health, behavioral, academic
      severity: alertData.severity, // low, medium, high, critical
      description: alertData.description,
      immediateActions: alertData.immediateActions || [],
      notifiedPersonnel: alertData.notifiedPersonnel || [],
      parentNotified: alertData.parentNotified || false,
      status: 'active',
      resolution: null,
      resolvedAt: null,
      followUpRequired: true,
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

// ==================== ANALYTICS AND REPORTING ====================

export const getSpecialistAnalytics = async (specialistId, timeframe = 'month') => {
  try {
    const tenantId = getTenantId(specialistId);
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get appointments analytics
    const appointmentsRef = collection(db, 'specialistAppointments');
    const appointmentsQuery = query(
      appointmentsRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    );

    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = appointmentsSnapshot.docs.map(doc => doc.data());

    // Get student notes analytics
    const notesRef = collection(db, 'studentNotes');
    const notesQuery = query(
      notesRef,
      where('specialistId', '==', specialistId),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    );

    const notesSnapshot = await getDocs(notesQuery);
    const notes = notesSnapshot.docs.map(doc => doc.data());

    // Calculate analytics
    const analytics = {
      timeframe,
      appointments: {
        total: appointments.length,
        completed: appointments.filter(apt => apt.status === 'completed').length,
        cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
        noShow: appointments.filter(apt => apt.status === 'no_show').length,
        byType: {}
      },
      students: {
        totalServed: new Set(appointments.map(apt => apt.studentId)).size,
        newStudents: new Set(notes.map(note => note.studentId)).size,
        activeInterventions: 0 // Would need to query intervention plans
      },
      productivity: {
        notesCreated: notes.length,
        averageNotesPerStudent: notes.length / new Set(notes.map(note => note.studentId)).size || 0,
        communicationLogs: 0 // Would need to query communication logs
      }
    };

    return analytics;
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
      ipAddress: null, // Would be populated by server-side function
      userAgent: navigator.userAgent,
      sessionId: null // Would be populated by session management
    };

    await addDoc(auditRef, auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error for audit logging failures
  }
};

// Export all functions
export {
  // Existing functions from original implementation
  createSpecialistProfile,
  getSpecialistProfile,
  updateSpecialistProfile,
  createAppointment,
  getSpecialistAppointments,
  updateAppointment,
  cancelAppointment,
  setSpecialistAvailability,
  getSpecialistAvailability,
  createStudentNote,
  getStudentNotes,
  updateStudentNote,
  deleteStudentNote,
  createStudentGroup,
  getSpecialistGroups,
  addStudentToGroup,
  removeStudentFromGroup,
  createSpecialEvent,
  getSpecialistEvents,
  registerStudentForEvent,
  updateEventRegistration,
  getStudentSchedule,
  searchStudents,
  getSpecialistStats,
  
  // New enhanced functions
  createInterventionPlan,
  getInterventionPlans,
  updateInterventionPlan,
  createProgressEntry,
  getProgressTracking,
  createCommunicationLog,
  getCommunicationLogs,
  uploadResource,
  getResourceLibrary,
  downloadResource,
  createAppointmentRequest,
  getAppointmentRequests,
  respondToAppointmentRequest,
  createCrisisAlert,
  getSpecialistAnalytics,
  createAuditLog
};

// Default export with all functions
export default {
  // Profile Management
  createSpecialistProfile,
  getSpecialistProfile,
  updateSpecialistProfile,
  
  // Appointment Management
  createAppointment,
  getSpecialistAppointments,
  updateAppointment,
  cancelAppointment,
  createAppointmentRequest,
  getAppointmentRequests,
  respondToAppointmentRequest,
  
  // Availability Management
  setSpecialistAvailability,
  getSpecialistAvailability,
  
  // Student Notes
  createStudentNote,
  getStudentNotes,
  updateStudentNote,
  deleteStudentNote,
  
  // Group Management
  createStudentGroup,
  getSpecialistGroups,
  addStudentToGroup,
  removeStudentFromGroup,
  
  // Special Events
  createSpecialEvent,
  getSpecialistEvents,
  registerStudentForEvent,
  updateEventRegistration,
  
  // Student Schedule
  getStudentSchedule,
  
  // Utility Functions
  searchStudents,
  getSpecialistStats,
  createAuditLog
};

