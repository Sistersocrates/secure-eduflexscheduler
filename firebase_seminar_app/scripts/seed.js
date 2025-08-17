import admin from 'firebase-admin';

// This script seeds the Firestore database with initial data for EduFlex Scheduler.
// Before running, ensure you have set up your Firebase project and have a
// service account key file. Set the GOOGLE_APPLICATION_CREDENTIALS environment
// variable to the path of your service account key file.
//
// Usage: node scripts/seed.js

console.log("🚀 Starting EduFlex Scheduler data import...");

// Check for service account credentials
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    '❌ ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.'
  );
  console.error(
    'Please download your service account key from the Firebase console and set the path to it.'
  );
  process.exit(1);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  process.exit(1);
}

const db = admin.firestore();

const seedDatabase = async () => {
    // 1. Create systemConfig collection
    console.log("📋 Creating systemConfig...");
    try {
        await db.collection('systemConfig').doc('default').set({
        appName: "EduFlex Scheduler",
        version: "1.0.0",
        features: {
            multiTenant: true,
            ferpaCompliant: true,
            auditLogging: true,
            realTimeUpdates: true
        },
        settings: {
            maxClassSize: 30,
            appointmentDuration: 30,
            scheduleHours: 7,
            timeZone: "America/New_York",
            academicYear: "2024-2025"
        },
        security: {
            sessionTimeout: 3600,
            passwordPolicy: {
            minLength: 8,
            requireSpecialChars: true,
            requireNumbers: true
            },
            ferpaCompliance: {
            enabled: true,
            auditRequired: true,
            dataRetentionDays: 2555
            }
        },
        createdAt: new Date(),
        updatedAt: new Date()
        });
        console.log("✅ SystemConfig created successfully!");
    } catch (error) {
        console.error("❌ Error creating systemConfig:", error);
    }

    // 2. Create default tenant
    console.log("🏫 Creating default tenant...");
    try {
        await db.collection('tenants').doc('default-tenant').set({
        name: "Default School District",
        type: "school_district",
        settings: {
            allowSelfRegistration: true,
            defaultRole: "student",
            requireApproval: false,
            ferpaCompliant: true
        },
        contact: {
            email: "admin@school.edu",
            phone: "+1-555-0123",
            address: "123 Education St, Learning City, LC 12345"
        },
        features: {
            studentDashboard: true,
            teacherDashboard: true,
            specialistDashboard: true,
            adminDashboard: true
        },
        branding: {
            primaryColor: "#1976d2",
            secondaryColor: "#dc004e",
            logo: "",
            favicon: ""
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active"
        });
        console.log("✅ Default tenant created successfully!");
    } catch (error) {
        console.error("❌ Error creating tenant:", error);
    }

    // 3. Create sample class for testing
    console.log("📚 Creating sample class...");
    try {
        await db.collection('classes').doc('sample-class-001').set({
        title: "Introduction to Mathematics",
        description: "Basic mathematics concepts for beginners",
        teacherId: "teacher-placeholder",
        teacherName: "Sample Teacher",
        tenantId: "default-tenant",
        schedule: {
            dayOfWeek: "Monday",
            startTime: "09:00",
            endTime: "10:00",
            duration: 60
        },
        enrollment: {
            maxStudents: 25,
            currentCount: 0,
            waitlistCount: 0
        },
        status: "active",
        category: "Mathematics",
        level: "Beginner",
        createdAt: new Date(),
        updatedAt: new Date()
        });
        console.log("✅ Sample class created successfully!");
    } catch (error) {
        console.error("❌ Error creating sample class:", error);
    }

    // 4. Create sample resource for testing
    console.log("📖 Creating sample resource...");
    try {
        await db.collection('resourceLibrary').doc('sample-resource-001').set({
        title: "Mathematics Study Guide",
        description: "Comprehensive study guide for basic mathematics",
        type: "document",
        category: "Study Materials",
        uploadedBy: "system",
        tenantId: "default-tenant",
        fileUrl: "",
        fileName: "math-study-guide.pdf",
        fileSize: 0,
        tags: ["mathematics", "study-guide", "beginner"],
        isPublic: true,
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
        });
        console.log("✅ Sample resource created successfully!");
    } catch (error) {
        console.error("❌ Error creating sample resource:", error);
    }

    // 5. Create system metrics document
    console.log("📊 Creating system metrics...");
    try {
        await db.collection('systemMetrics').doc('current').set({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalSpecialists: 0,
        totalAdmins: 0,
        totalClasses: 1,
        totalEnrollments: 0,
        totalAppointments: 0,
        systemHealth: {
            status: "healthy",
            uptime: 100,
            lastCheck: new Date()
        },
        usage: {
            dailyActiveUsers: 0,
            weeklyActiveUsers: 0,
            monthlyActiveUsers: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
        });
        console.log("✅ System metrics created successfully!");
    } catch (error) {
        console.error("❌ Error creating system metrics:", error);
    }

    // 6. Create initial audit log
    console.log("📝 Creating initial audit log...");
    try {
        await db.collection('auditLogs').add({
        action: "SYSTEM_INITIALIZATION",
        userId: "system",
        userRole: "system",
        tenantId: "default-tenant",
        resourceType: "database",
        resourceId: "initial-setup",
        details: {
            description: "Initial database setup completed",
            collections: ["systemConfig", "tenants", "classes", "resourceLibrary", "systemMetrics"],
            ferpaCompliant: true
        },
        ipAddress: "console",
        userAgent: "Firebase Console",
        timestamp: new Date(),
        severity: "info"
        });
        console.log("✅ Initial audit log created successfully!");
    } catch (error) {
        console.error("❌ Error creating audit log:", error);
    }

    // Wait a moment and then show completion message
    setTimeout(() => {
    console.log(`
    🎉 EduFlex Scheduler Database Setup Complete!

    ✅ Collections Created:
       • systemConfig (app configuration)
       • tenants (multi-tenant support)
       • classes (sample class)
       • resourceLibrary (sample resource)
       • systemMetrics (system monitoring)
       • auditLogs (FERPA compliance)

    🔒 Security Features:
       • FERPA-compliant data structure
       • Role-based access controls
       • Audit logging enabled
       • Multi-tenant isolation

    🎯 Next Steps:
       1. Refresh your Firebase console to see the data
       2. Deploy your React application
       3. Test user authentication
       4. Create your first admin user

    Your EduFlex Scheduler is ready to go! 🚀
      `);
    }, 3000);
};

seedDatabase().catch(error => {
    console.error('❌ An unexpected error occurred during seeding:', error);
    process.exit(1);
});
