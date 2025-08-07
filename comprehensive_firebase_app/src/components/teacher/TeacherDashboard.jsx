import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  getTeacherClasses, 
  getClassRoster, 
  getTeacherResourceRequests,
  subscribeToTeacherClasses 
} from '../../lib/teacherFirebase';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingRequests: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load teacher's classes
      const teacherClasses = await getTeacherClasses(user.uid);
      setClasses(teacherClasses);

      // Load resource requests
      const requests = await getTeacherResourceRequests(user.uid);
      setResourceRequests(requests);

      // Calculate dashboard stats
      let totalStudents = 0;
      for (const classItem of teacherClasses) {
        totalStudents += classItem.currentEnrollment || 0;
      }

      const pendingRequests = requests.filter(req => req.status === 'submitted').length;

      setDashboardStats({
        totalClasses: teacherClasses.length,
        totalStudents,
        pendingRequests,
        attendanceRate: 85 // This would be calculated from actual attendance data
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600">{trend}</span>
        </div>
      )}
    </div>
  );

  const ClassCard = ({ classItem }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              classItem.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {classItem.status}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {classItem.description}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Hour {classItem.hour}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{classItem.room || 'Room TBD'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{classItem.currentEnrollment || 0}/{classItem.capacity}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Eye className="h-4 w-4 mr-1" />
                View
              </button>
              <button className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ClipboardCheck className="h-4 w-4 mr-1" />
                Attendance
              </button>
            </div>
            
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {classItem.imageUrl && (
          <div className="ml-4">
            <img 
              src={classItem.imageUrl} 
              alt={classItem.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );

  const ResourceRequestCard = ({ request }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{request.title}</h4>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              request.status === 'approved' 
                ? 'bg-green-100 text-green-800'
                : request.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {request.status}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 mb-2">{request.description}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="capitalize">{request.type}</span>
            {request.amount && <span>${request.amount}</span>}
            {request.neededByDate && (
              <span>Due: {new Date(request.neededByDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        <div className="ml-2">
          {request.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {request.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
          {request.status === 'submitted' && <Clock className="h-4 w-4 text-yellow-500" />}
        </div>
      </div>
    </div>
  );

  const QuickActions = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Plus className="h-4 w-4 mr-2" />
          New Class
        </button>
        <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Take Attendance
        </button>
        <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Users className="h-4 w-4 mr-2" />
          View Rosters
        </button>
        <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Reports
        </button>
      </div>
    </div>
  );

  const RecentActivity = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">Attendance recorded for Biology 101</p>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">New student enrolled in Chemistry Lab</p>
            <p className="text-xs text-gray-500">4 hours ago</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">Resource request pending approval</p>
            <p className="text-xs text-gray-500">1 day ago</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.displayName}</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create New Class
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Classes"
          value={dashboardStats.totalClasses}
          icon={BookOpen}
          color="bg-blue-500"
          description="Active classes"
        />
        <StatCard
          title="Total Students"
          value={dashboardStats.totalStudents}
          icon={Users}
          color="bg-green-500"
          description="Across all classes"
        />
        <StatCard
          title="Pending Requests"
          value={dashboardStats.pendingRequests}
          icon={AlertCircle}
          color="bg-yellow-500"
          description="Resource requests"
        />
        <StatCard
          title="Attendance Rate"
          value={`${dashboardStats.attendanceRate}%`}
          icon={TrendingUp}
          color="bg-purple-500"
          trend="+2.5% from last week"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          
          <div className="space-y-4">
            {classes.slice(0, 3).map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} />
            ))}
            
            {classes.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
                <p className="text-gray-600 mb-4">Create your first class to get started</p>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          
          {/* Resource Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resource Requests</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            
            <div className="space-y-3">
              {resourceRequests.slice(0, 3).map((request) => (
                <ResourceRequestCard key={request.id} request={request} />
              ))}
              
              {resourceRequests.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No resource requests</p>
              )}
            </div>
          </div>

          <RecentActivity />
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {classes.filter(c => c.status === 'published').slice(0, 5).map((classItem) => (
            <div key={classItem.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{classItem.title}</p>
                  <p className="text-xs text-gray-500">Hour {classItem.hour} • {classItem.room}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{classItem.currentEnrollment} students</span>
                <button className="text-xs text-blue-600 hover:text-blue-700">Take Attendance</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

