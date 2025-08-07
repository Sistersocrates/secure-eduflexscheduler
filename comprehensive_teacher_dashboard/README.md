# EduFlex Scheduler - Enhanced Seminar Management System

A comprehensive, secure, and FERPA-compliant seminar management system built with React, Firebase, and modern web technologies.

## 🚀 Features

### 🔐 Security & Compliance
- **FERPA-compliant** data protection and audit logging
- **Google OAuth** authentication with role-based access control
- **Enterprise-grade security** with comprehensive audit trails
- **Rate limiting** and abuse protection
- **Secure session management** and automatic logout

### 👥 Role-Based Access Control

#### 🎓 Students
- Browse and search comprehensive seminar catalog
- Enroll in seminars or join waitlists
- View personalized schedule with calendar integration
- Track attendance and credits earned
- Book counseling appointments
- Monitor academic progress

#### 👨‍🏫 Teachers/Faculty
- Create and manage seminars
- Access student rosters and take attendance
- Grade assignments and track student progress
- Generate reports and view analytics
- Manage seminar content and resources

#### 🧑‍💼 Counselors
- Monitor student progress and academic journeys
- Schedule and manage counseling appointments
- Generate student progress reports
- Access counseling resources and materials
- Support student academic planning

#### 🛡️ Administrators
- Manage all users and system settings
- View comprehensive system analytics
- Generate system-wide reports
- Import/export data
- Monitor security and audit logs
- Configure system preferences

### 🎨 User Experience
- **Responsive design** that works on desktop and mobile
- **Role-based dashboard** with personalized content
- **Intuitive navigation** with role-specific menu items
- **Real-time updates** and notifications
- **Modern UI** with Tailwind CSS styling

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Deployment**: Vercel
- **Version Control**: Git/GitHub

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sistersocrates/secure-eduflexscheduler.git
   cd secure-eduflexscheduler/firebase_seminar_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Firebase Setup

### 1. Authentication
- Enable Google OAuth in Firebase Console
- Add your domain to authorized domains
- Configure OAuth consent screen

### 2. Firestore Database
Create the following collections with security rules:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'counselor']);
    }
    
    // Seminars collection
    match /seminars/{seminarId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['teacher', 'admin']);
    }
    
    // Enrollments collection
    match /enrollments/{enrollmentId} {
      allow read, write: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['teacher', 'counselor', 'admin']);
    }
    
    // Audit logs (admin only)
    match /auditLogs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Required Collections
- `users` - User profiles and roles
- `seminars` - Seminar information and metadata
- `enrollments` - Student-seminar enrollment records
- `auditLogs` - FERPA-compliant audit trail

## 🎯 Role-Based Features

### Student Dashboard
- **Quick Actions**: Browse Seminars, View Schedule, My Enrollments, Book Appointment
- **Stats**: Enrolled Seminars, Completed, Upcoming Events, Total Credits
- **Recent Activity**: Enrollment updates, completion notifications
- **Academic Progress**: Completion rate, GPA, credits earned

### Teacher Dashboard
- **Quick Actions**: Create Seminar, My Seminars, Take Attendance, Grade Assignments
- **Stats**: My Seminars, Total Students, Active Seminars, Average Rating
- **Teaching Overview**: Rating, students taught, active seminars

### Counselor Dashboard
- **Quick Actions**: Student Management, Appointments, Progress Reports, Resources
- **Stats**: Active Students, Appointments Today, Pending Reviews, Success Rate
- **Support Overview**: Student metrics and counseling effectiveness

### Admin Dashboard
- **Quick Actions**: User Management, System Analytics, Settings, Reports
- **Stats**: Total Users, Active Seminars, System Health, Monthly Growth
- **System Overview**: Comprehensive system metrics and health indicators

## 🔒 Security Features

### FERPA Compliance
- **Audit Logging**: All user actions are logged with timestamps and details
- **Access Controls**: Role-based permissions for data access
- **Data Protection**: Secure handling of student educational records
- **Privacy Controls**: User consent and data minimization

### Authentication Security
- **Google OAuth 2.0** with PKCE flow
- **Session Management** with automatic timeout
- **Role Verification** on every request
- **Secure Token Handling** with Firebase Auth

### Application Security
- **Input Validation** with Zod schemas
- **XSS Protection** with Content Security Policy
- **CSRF Protection** with SameSite cookies
- **Rate Limiting** to prevent abuse

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (320px - 767px)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy --only hosting`

## 📊 Analytics & Monitoring

- **Firebase Analytics** for user behavior tracking
- **Performance Monitoring** with Core Web Vitals
- **Error Tracking** with detailed error reporting
- **Audit Logs** for compliance and security monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review Firebase console for configuration issues

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Complete role-based access control
- ✅ Enhanced dashboard with role-specific content
- ✅ Comprehensive navigation system
- ✅ FERPA-compliant audit logging
- ✅ Modern UI with Tailwind CSS
- ✅ Responsive design for all devices

### v1.0.0
- ✅ Basic Firebase authentication
- ✅ Simple seminar management
- ✅ Basic user roles

---

**Built with ❤️ for educational institutions**

🔒 **Secure** • 📚 **FERPA Compliant** • 🚀 **Modern** • 📱 **Responsive**

