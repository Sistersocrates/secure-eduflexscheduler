import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from './firebase';

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with filtering and pagination
 */
export const getUsers = async (filters = {}, paginationOptions = {}) => {
  try {
    const { role, status, search, tenantId } = filters;
    const { limitCount = 50, lastDoc } = paginationOptions;

    let q = collection(db, 'users');
    const constraints = [];

    // Add tenant filter if specified
    if (tenantId) {
      constraints.push(where('tenantId', '==', tenantId));
    }

    // Add role filter if specified
    if (role) {
      constraints.push(where('role', '==', role));
    }

    // Add status filter if specified
    if (status) {
      constraints.push(where('status', '==', status));
    }

    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'));

    // Add limit
    constraints.push(limit(limitCount));

    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      // Filter by search term if provided
      if (!search || 
          userData.displayName?.toLowerCase().includes(search.toLowerCase()) ||
          userData.email?.toLowerCase().includes(search.toLowerCase())) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });

    return {
      users,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

/**
 * Create a new user account
 */
export const createUser = async (userData) => {
  try {
    const { email, password, displayName, role, tenantId, ...additionalData } = userData;

    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName,
      role,
      tenantId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: null,
      ...additionalData
    };

    await updateDoc(doc(db, 'users', user.uid), userDoc);

    // Log the action
    await logAdminAction('user_created', 'user', user.uid, {
      email,
      role,
      tenantId
    });

    return {
      id: user.uid,
      ...userDoc
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user information
 */
export const updateUser = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);

    // Log the action
    await logAdminAction('user_updated', 'user', userId, updates);

    return updateData;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Update user status (active, inactive, suspended)
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // Log the action
    await logAdminAction('user_status_updated', 'user', userId, { status });

    return { status };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Bulk import users from array
 */
export const importUsers = async (usersData, tenantId) => {
  try {
    const batch = writeBatch(db);
    const results = {
      successful: [],
      failed: [],
      total: usersData.length
    };

    for (const userData of usersData) {
      try {
        const { email, displayName, role, ...additionalData } = userData;
        
        // Generate temporary password
        const tempPassword = generateTempPassword();
        
        // Create authentication account
        const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
        const user = userCredential.user;

        // Prepare user document
        const userDoc = {
          uid: user.uid,
          email: user.email,
          displayName,
          role,
          tenantId,
          status: 'active',
          needsPasswordReset: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...additionalData
        };

        batch.set(doc(db, 'users', user.uid), userDoc);
        
        results.successful.push({
          email,
          uid: user.uid,
          tempPassword
        });

      } catch (error) {
        results.failed.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    await batch.commit();

    // Log the bulk import action
    await logAdminAction('users_bulk_imported', 'user', null, {
      tenantId,
      successful: results.successful.length,
      failed: results.failed.length,
      total: results.total
    });

    return results;
  } catch (error) {
    console.error('Error importing users:', error);
    throw error;
  }
};

/**
 * Send password reset email to user
 */
export const sendUserPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    
    // Log the action
    await logAdminAction('password_reset_sent', 'user', null, { email });

    return { success: true };
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw error;
  }
};

// ==================== TENANT MANAGEMENT ====================

/**
 * Get all tenants
 */
export const getTenants = async (filters = {}) => {
  try {
    const { status } = filters;
    
    let q = collection(db, 'tenants');
    const constraints = [orderBy('createdAt', 'desc')];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const tenants = [];
    snapshot.forEach(doc => {
      tenants.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return tenants;
  } catch (error) {
    console.error('Error getting tenants:', error);
    throw error;
  }
};

/**
 * Create a new tenant
 */
export const createTenant = async (tenantData) => {
  try {
    const tenantDoc = {
      ...tenantData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userCount: 0,
      settings: {
        allowSelfRegistration: false,
        requireEmailVerification: true,
        sessionTimeout: 30,
        ...tenantData.settings
      }
    };

    const docRef = await addDoc(collection(db, 'tenants'), tenantDoc);

    // Log the action
    await logAdminAction('tenant_created', 'tenant', docRef.id, tenantData);

    return {
      id: docRef.id,
      ...tenantDoc
    };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
};

/**
 * Update tenant information
 */
export const updateTenant = async (tenantId, updates) => {
  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(tenantRef, updateData);

    // Log the action
    await logAdminAction('tenant_updated', 'tenant', tenantId, updates);

    return updateData;
  } catch (error) {
    console.error('Error updating tenant:', error);
    throw error;
  }
};

// ==================== SYSTEM SETTINGS ====================

/**
 * Get system settings
 */
export const getSystemSettings = async (category = null, tenantId = null) => {
  try {
    let q = collection(db, 'systemSettings');
    const constraints = [];

    if (tenantId) {
      constraints.push(where('tenantId', '==', tenantId));
    } else {
      constraints.push(where('tenantId', '==', null));
    }

    if (category) {
      constraints.push(where('category', '==', category));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const settings = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!settings[data.category]) {
        settings[data.category] = {};
      }
      settings[data.category][data.key] = data.value;
    });

    return settings;
  } catch (error) {
    console.error('Error getting system settings:', error);
    throw error;
  }
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (settings, tenantId = null) => {
  try {
    const batch = writeBatch(db);

    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings)) {
        const settingId = `${tenantId || 'global'}_${category}_${key}`;
        const settingRef = doc(db, 'systemSettings', settingId);
        
        batch.set(settingRef, {
          tenantId,
          category,
          key,
          value,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }

    await batch.commit();

    // Log the action
    await logAdminAction('system_settings_updated', 'settings', null, {
      tenantId,
      categories: Object.keys(settings)
    });

    return settings;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// ==================== ACADEMIC TERMS ====================

/**
 * Get academic terms
 */
export const getAcademicTerms = async (tenantId, filters = {}) => {
  try {
    const { isActive } = filters;
    
    let q = collection(db, 'academicTerms');
    const constraints = [
      where('tenantId', '==', tenantId),
      orderBy('startDate', 'desc')
    ];

    if (isActive !== undefined) {
      constraints.push(where('isActive', '==', isActive));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const terms = [];
    snapshot.forEach(doc => {
      terms.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return terms;
  } catch (error) {
    console.error('Error getting academic terms:', error);
    throw error;
  }
};

/**
 * Create academic term
 */
export const createAcademicTerm = async (termData) => {
  try {
    const termDoc = {
      ...termData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'academicTerms'), termDoc);

    // Log the action
    await logAdminAction('academic_term_created', 'academicTerm', docRef.id, termData);

    return {
      id: docRef.id,
      ...termDoc
    };
  } catch (error) {
    console.error('Error creating academic term:', error);
    throw error;
  }
};

/**
 * Update academic term
 */
export const updateAcademicTerm = async (termId, updates) => {
  try {
    const termRef = doc(db, 'academicTerms', termId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(termRef, updateData);

    // Log the action
    await logAdminAction('academic_term_updated', 'academicTerm', termId, updates);

    return updateData;
  } catch (error) {
    console.error('Error updating academic term:', error);
    throw error;
  }
};

// ==================== CREDIT TYPES ====================

/**
 * Get credit types
 */
export const getCreditTypes = async (tenantId, filters = {}) => {
  try {
    const { isActive } = filters;
    
    let q = collection(db, 'creditTypes');
    const constraints = [
      where('tenantId', '==', tenantId),
      orderBy('name', 'asc')
    ];

    if (isActive !== undefined) {
      constraints.push(where('isActive', '==', isActive));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const creditTypes = [];
    snapshot.forEach(doc => {
      creditTypes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return creditTypes;
  } catch (error) {
    console.error('Error getting credit types:', error);
    throw error;
  }
};

/**
 * Create credit type
 */
export const createCreditType = async (creditTypeData) => {
  try {
    const creditTypeDoc = {
      ...creditTypeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'creditTypes'), creditTypeDoc);

    // Log the action
    await logAdminAction('credit_type_created', 'creditType', docRef.id, creditTypeData);

    return {
      id: docRef.id,
      ...creditTypeDoc
    };
  } catch (error) {
    console.error('Error creating credit type:', error);
    throw error;
  }
};

// ==================== REPORTS ====================

/**
 * Get available reports
 */
export const getReports = async (tenantId, filters = {}) => {
  try {
    const { type } = filters;
    
    let q = collection(db, 'reports');
    const constraints = [
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    ];

    if (type) {
      constraints.push(where('type', '==', type));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const reports = [];
    snapshot.forEach(doc => {
      reports.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return reports;
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
};

/**
 * Create a new report
 */
export const createReport = async (reportData) => {
  try {
    const reportDoc = {
      ...reportData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastRunAt: null
    };

    const docRef = await addDoc(collection(db, 'reports'), reportDoc);

    // Log the action
    await logAdminAction('report_created', 'report', docRef.id, reportData);

    return {
      id: docRef.id,
      ...reportDoc
    };
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

/**
 * Run a report and store results
 */
export const runReport = async (reportId, parameters = {}) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    const report = reportDoc.data();
    
    // Generate report data based on type
    const resultData = await generateReportData(report.type, {
      ...report.parameters,
      ...parameters,
      tenantId: report.tenantId
    });

    // Store report result
    const resultDoc = {
      reportId,
      tenantId: report.tenantId,
      resultData,
      parameters,
      runBy: auth.currentUser?.uid,
      createdAt: serverTimestamp()
    };

    const resultRef = await addDoc(collection(db, 'reportResults'), resultDoc);

    // Update report last run time
    await updateDoc(reportRef, {
      lastRunAt: serverTimestamp()
    });

    // Log the action
    await logAdminAction('report_executed', 'report', reportId, parameters);

    return {
      id: resultRef.id,
      ...resultDoc
    };
  } catch (error) {
    console.error('Error running report:', error);
    throw error;
  }
};

/**
 * Get report results
 */
export const getReportResults = async (reportId, filters = {}) => {
  try {
    const { dateRange } = filters;
    
    let q = collection(db, 'reportResults');
    const constraints = [
      where('reportId', '==', reportId),
      orderBy('createdAt', 'desc')
    ];

    if (dateRange) {
      constraints.push(where('createdAt', '>=', dateRange.start));
      constraints.push(where('createdAt', '<=', dateRange.end));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const results = [];
    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return results;
  } catch (error) {
    console.error('Error getting report results:', error);
    throw error;
  }
};

// ==================== PARENT TOURS ====================

/**
 * Get parent tours
 */
export const getParentTours = async (tenantId, filters = {}) => {
  try {
    const { status, dateRange } = filters;
    
    let q = collection(db, 'parentTours');
    const constraints = [
      where('tenantId', '==', tenantId),
      orderBy('tourDate', 'desc')
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (dateRange) {
      constraints.push(where('tourDate', '>=', dateRange.start));
      constraints.push(where('tourDate', '<=', dateRange.end));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const tours = [];
    snapshot.forEach(doc => {
      tours.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return tours;
  } catch (error) {
    console.error('Error getting parent tours:', error);
    throw error;
  }
};

/**
 * Create parent tour
 */
export const createParentTour = async (tourData) => {
  try {
    const tourDoc = {
      ...tourData,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'parentTours'), tourDoc);

    // Log the action
    await logAdminAction('parent_tour_created', 'parentTour', docRef.id, tourData);

    return {
      id: docRef.id,
      ...tourDoc
    };
  } catch (error) {
    console.error('Error creating parent tour:', error);
    throw error;
  }
};

/**
 * Update parent tour
 */
export const updateParentTour = async (tourId, updates) => {
  try {
    const tourRef = doc(db, 'parentTours', tourId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(tourRef, updateData);

    // Log the action
    await logAdminAction('parent_tour_updated', 'parentTour', tourId, updates);

    return updateData;
  } catch (error) {
    console.error('Error updating parent tour:', error);
    throw error;
  }
};

// ==================== SYSTEM LOGS ====================

/**
 * Get system logs
 */
export const getSystemLogs = async (tenantId, filters = {}) => {
  try {
    const { userId, action, entityType, dateRange } = filters;
    
    let q = collection(db, 'systemLogs');
    const constraints = [
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
      limit(100)
    ];

    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    if (action) {
      constraints.push(where('action', '==', action));
    }

    if (entityType) {
      constraints.push(where('entityType', '==', entityType));
    }

    if (dateRange) {
      constraints.push(where('createdAt', '>=', dateRange.start));
      constraints.push(where('createdAt', '<=', dateRange.end));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return logs;
  } catch (error) {
    console.error('Error getting system logs:', error);
    throw error;
  }
};

/**
 * Log admin action
 */
export const logAdminAction = async (action, entityType, entityId, details = {}) => {
  try {
    const logDoc = {
      userId: auth.currentUser?.uid,
      tenantId: details.tenantId || null,
      action,
      entityType,
      entityId,
      details,
      ipAddress: null, // Would be populated by backend
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'systemLogs'), logDoc);
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw error for logging failures
  }
};

// ==================== ANALYTICS ====================

/**
 * Get system analytics
 */
export const getSystemAnalytics = async (tenantId, timeframe = 'week') => {
  try {
    // This would typically aggregate data from various collections
    // For now, return mock data structure
    const analytics = {
      users: {
        total: 0,
        active: 0,
        newThisWeek: 0,
        byRole: {}
      },
      activity: {
        logins: 0,
        pageViews: 0,
        actions: 0
      },
      performance: {
        averageLoadTime: 0,
        errorRate: 0,
        uptime: 99.9
      }
    };

    // Get user statistics
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('tenantId', '==', tenantId))
    );
    
    analytics.users.total = usersSnapshot.size;
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const role = userData.role || 'unknown';
      analytics.users.byRole[role] = (analytics.users.byRole[role] || 0) + 1;
      
      if (userData.status === 'active') {
        analytics.users.active++;
      }
    });

    return analytics;
  } catch (error) {
    console.error('Error getting system analytics:', error);
    throw error;
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate temporary password
 */
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Generate report data based on type
 */
const generateReportData = async (reportType, parameters) => {
  const { tenantId } = parameters;
  
  switch (reportType) {
    case 'user_summary':
      return await generateUserSummaryReport(tenantId, parameters);
    case 'credit_tracking':
      return await generateCreditTrackingReport(tenantId, parameters);
    case 'attendance_summary':
      return await generateAttendanceSummaryReport(tenantId, parameters);
    case 'system_usage':
      return await generateSystemUsageReport(tenantId, parameters);
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
};

/**
 * Generate user summary report
 */
const generateUserSummaryReport = async (tenantId, parameters) => {
  const usersSnapshot = await getDocs(
    query(collection(db, 'users'), where('tenantId', '==', tenantId))
  );
  
  const summary = {
    totalUsers: usersSnapshot.size,
    byRole: {},
    byStatus: {},
    recentRegistrations: []
  };
  
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    const role = userData.role || 'unknown';
    const status = userData.status || 'unknown';
    
    summary.byRole[role] = (summary.byRole[role] || 0) + 1;
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
  });
  
  return summary;
};

/**
 * Generate credit tracking report
 */
const generateCreditTrackingReport = async (tenantId, parameters) => {
  // This would aggregate credit data from enrollments and completions
  return {
    totalCreditsAwarded: 0,
    creditsByType: {},
    studentProgress: [],
    deficiencies: []
  };
};

/**
 * Generate attendance summary report
 */
const generateAttendanceSummaryReport = async (tenantId, parameters) => {
  // This would aggregate attendance data
  return {
    overallAttendanceRate: 0,
    attendanceByClass: {},
    attendanceTrends: [],
    absenteeism: []
  };
};

/**
 * Generate system usage report
 */
const generateSystemUsageReport = async (tenantId, parameters) => {
  // This would aggregate usage analytics
  return {
    activeUsers: 0,
    featureUsage: {},
    performanceMetrics: {},
    errorRates: {}
  };
};

export default {
  // User Management
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  importUsers,
  sendUserPasswordReset,
  
  // Tenant Management
  getTenants,
  createTenant,
  updateTenant,
  
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  
  // Academic Terms
  getAcademicTerms,
  createAcademicTerm,
  updateAcademicTerm,
  
  // Credit Types
  getCreditTypes,
  createCreditType,
  
  // Reports
  getReports,
  createReport,
  runReport,
  getReportResults,
  
  // Parent Tours
  getParentTours,
  createParentTour,
  updateParentTour,
  
  // System Logs
  getSystemLogs,
  logAdminAction,
  
  // Analytics
  getSystemAnalytics
};

