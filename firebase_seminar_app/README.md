# 🔥 Secure Firebase Seminar Management System

A secure, FERPA-compliant student seminar management system built with React and Firebase.

## 🚀 Features

- **🔐 Secure Authentication**: Google OAuth with Firebase Auth
- **📊 Real-time Database**: Firestore with security rules
- **🛡️ FERPA Compliant**: Comprehensive audit logging and access controls
- **⚡ Rate Limiting**: Built-in abuse protection
- **🔒 Input Validation**: Zod schemas for all user inputs
- **📱 Responsive Design**: Mobile-friendly interface
- **🌐 Custom Domain**: Support for custom domains

## 🔒 Security Features

### Authentication & Authorization
- Google OAuth 2.0 with PKCE flow
- Role-based access control (Student/Faculty/Admin)
- Secure session management with automatic timeout
- Multi-factor authentication support

### Data Protection
- Firestore security rules for data access control
- Input validation and sanitization
- Rate limiting to prevent abuse
- Comprehensive audit logging for FERPA compliance
- Encrypted data transmission (HTTPS)

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Referrer Policy for privacy

## 🛠️ Technology Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Build Tool**: Vite
- **Validation**: Zod
- **Deployment**: Firebase Hosting with custom domain

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled
- Google OAuth credentials configured

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd firebase-seminar-management
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Configuration
1. Enable Google Authentication in Firebase Console
2. Set up Firestore database with security rules
3. Add authorized domains for your application

### 4. Development
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
```

### 6. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

## 🔧 Firebase Setup

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Students can only access their own data
    match /students/{studentId} {
      allow read, write: if request.auth != null && request.auth.uid == studentId;
    }
    
    // Seminars are readable by authenticated users
    match /seminars/{seminarId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Enrollments - students can enroll themselves
    match /enrollments/{enrollmentId} {
      allow read: if request.auth != null && 
        resource.data.studentId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.studentId == request.auth.uid;
      allow delete: if request.auth != null && 
        resource.data.studentId == request.auth.uid;
    }
    
    // Audit logs for FERPA compliance
    match /auditLogs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## 📊 Database Schema

### Collections

#### `students`
```javascript
{
  id: string,           // User UID
  email: string,        // User email
  displayName: string,  // Full name
  photoURL: string,     // Profile picture
  role: string,         // 'student', 'faculty', 'admin'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `seminars`
```javascript
{
  id: string,           // Auto-generated
  title: string,        // Seminar title
  description: string,  // Seminar description
  date: string,         // ISO date string
  location: string,     // Physical location
  capacity: number,     // Maximum enrollment
  currentEnrollment: number,
  createdBy: string,    // Creator's UID
  isLocked: boolean,    // Enrollment locked
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `enrollments`
```javascript
{
  id: string,           // Auto-generated
  studentId: string,    // Student UID
  seminarId: string,    // Seminar ID
  enrolledAt: timestamp
}
```

#### `auditLogs`
```javascript
{
  id: string,           // Auto-generated
  action: string,       // Action performed
  userId: string,       // User who performed action
  resourceType: string, // Type of resource
  resourceId: string,   // Resource ID
  details: object,      // Additional details
  timestamp: timestamp,
  userAgent: string     // Browser info
}
```

## 🔒 FERPA Compliance

This system implements FERPA compliance through:

- **Access Controls**: Role-based authentication and authorization
- **Audit Logging**: All user actions are logged with timestamps
- **Data Minimization**: Only necessary data is collected and stored
- **Secure Transmission**: All data encrypted in transit (HTTPS)
- **User Consent**: Clear privacy policies and consent mechanisms
- **Data Retention**: Configurable data retention policies

## 🛡️ Security Best Practices

- Environment variables for sensitive configuration
- Input validation and sanitization
- Rate limiting to prevent abuse
- Security headers for XSS and clickjacking protection
- Regular dependency updates and security audits
- Comprehensive error handling without information disclosure

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For security issues, please email: security@yourdomain.com

For general support: support@yourdomain.com

---

**🔥 Built with Firebase • 🔒 Security First • 📚 FERPA Compliant**

