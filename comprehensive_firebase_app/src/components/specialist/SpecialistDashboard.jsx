import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  getSpecialistStats,
  getSpecialistAppointments,
  getInterventionPlans,
  getAppointmentRequests,
  getCommunicationLogs,
  getSpecialistAnalytics
} from '../../lib/specialistFirebase';
import AppointmentManagement from './AppointmentManagement';
import StudentNotesManagement from './StudentNotesManagement';
import InterventionPlansManagement from './InterventionPlansManagement';
import { 
  Calendar,
  Users,
  FileText,
  Target,
  TrendingUp,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  MessageSquare,
  Star,
  Award,
  Heart,
  Brain,
  Lightbulb,
  Shield,
  Settings,
  Download,
  Filter,
  Search,
  Plus,
  Eye,
  ChevronRight,
  Loader
} from 'lucide-react';

const SpecialistDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentCommunications, setRecentCommunications] = useState([]);
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [
        statsData,
        appointmentsData,
        plansData,
        requestsData,
        communicationsData,
        analyticsData
      ] = await Promise.all([
        getSpecialistStats(user.uid),
        getSpecialistAppointments(user.uid, { limit: 5 }),
        getInterventionPlans(user.uid),
        getAppointmentRequests(user.uid, 'pending'),
        getCommunicationLogs(user.uid),
        getSpecialistAnalytics(user.uid, 'week')
      ]);

      setStats(statsData);
      setRecentAppointments(appointmentsData);
      setActivePlans(plansData.filter(plan => plan.status === 'active').slice(0, 5));
      setPendingRequests(requestsData);
      setRecentCommunications(communicationsData.slice(0, 5));
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
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

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-left group"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
      </div>
    </button>
  );

  const AppointmentCard = ({ appointment }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">
          {appointment.student?.displayName || 'Unknown Student'}
        </p>
        <p className="text-xs text-gray-600">{appointment.title}</p>
        <p className="text-xs text-gray-500">{formatDate(appointment.startTime)}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
        appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {appointment.status}
      </span>
    </div>
  );

  const PlanCard = ({ plan }) => {
    const progress = plan.goals ? 
      Math.round((plan.goals.filter(g => g.status === 'completed').length / plan.goals.length) * 100) : 0;
    
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <Target className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{plan.title}</p>
          <p className="text-xs text-gray-600">{plan.student?.displayName}</p>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{progress}%</span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          plan.priority === 'high' ? 'bg-red-100 text-red-800' :
          plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {plan.priority}
        </span>
      </div>
    );
  };

  const RequestCard = ({ request }) => (
    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
      <Bell className="h-5 w-5 text-yellow-600" />
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">
          {request.student?.displayName || 'Unknown Student'}
        </p>
        <p className="text-xs text-gray-600">{request.reason}</p>
        <p className="text-xs text-gray-500">
          Requested: {formatDate(request.requestedDate)}
        </p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        request.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
        request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {request.urgency}
      </span>
    </div>
  );

  const CommunicationCard = ({ communication }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <MessageSquare className="h-5 w-5 text-green-600" />
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{communication.subject}</p>
        <p className="text-xs text-gray-600">
          {communication.student?.displayName} - {communication.communicationType}
        </p>
        <p className="text-xs text-gray-500">{formatDate(communication.createdAt)}</p>
      </div>
      {communication.followUpRequired && (
        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
      )}
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="This Week's Appointments"
          value={stats.appointmentsThisWeek || 0}
          icon={Calendar}
          color="bg-blue-600"
          subtitle={`${stats.completedAppointments || 0} completed`}
        />
        <StatCard
          title="Students Served"
          value={stats.studentsServed || 0}
          icon={Users}
          color="bg-green-600"
          subtitle="This month"
        />
        <StatCard
          title="Active Plans"
          value={stats.activeGroups || 0}
          icon={Target}
          color="bg-purple-600"
          subtitle="Intervention plans"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          icon={Bell}
          color="bg-orange-600"
          subtitle="Need response"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Schedule Appointment"
            description="Book a new student appointment"
            icon={Calendar}
            color="bg-blue-600"
            onClick={() => setActiveTab('appointments')}
          />
          <QuickActionCard
            title="Create Note"
            description="Document student interaction"
            icon={FileText}
            color="bg-green-600"
            onClick={() => setActiveTab('notes')}
          />
          <QuickActionCard
            title="New Intervention Plan"
            description="Create student support plan"
            icon={Target}
            color="bg-purple-600"
            onClick={() => setActiveTab('plans')}
          />
          <QuickActionCard
            title="View Analytics"
            description="Review performance metrics"
            icon={BarChart3}
            color="bg-indigo-600"
            onClick={() => setActiveTab('analytics')}
          />
          <QuickActionCard
            title="Resource Library"
            description="Access teaching materials"
            icon={Lightbulb}
            color="bg-yellow-600"
            onClick={() => setActiveTab('resources')}
          />
          <QuickActionCard
            title="Communication Log"
            description="Record parent contact"
            icon={MessageSquare}
            color="bg-pink-600"
            onClick={() => setActiveTab('communications')}
          />
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
            <button
              onClick={() => setActiveTab('appointments')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentAppointments.length > 0 ? (
              recentAppointments.map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent appointments</p>
            )}
          </div>
        </div>

        {/* Active Plans */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Intervention Plans</h2>
            <button
              onClick={() => setActiveTab('plans')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {activePlans.length > 0 ? (
              activePlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No active plans</p>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Requests</h2>
            <button
              onClick={() => setActiveTab('appointments')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingRequests.length > 0 ? (
              pendingRequests.slice(0, 3).map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No pending requests</p>
            )}
          </div>
        </div>

        {/* Recent Communications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Communications</h2>
            <button
              onClick={() => setActiveTab('communications')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentCommunications.length > 0 ? (
              recentCommunications.map(communication => (
                <CommunicationCard key={communication.id} communication={communication} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent communications</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Analytics Summary */}
      {analytics && Object.keys(analytics).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.appointments?.total || 0}
              </div>
              <div className="text-sm text-gray-600">Total Appointments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.appointments?.completed || 0}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.students?.totalServed || 0}
              </div>
              <div className="text-sm text-gray-600">Students Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.productivity?.notesCreated || 0}
              </div>
              <div className="text-sm text-gray-600">Notes Created</div>
            </div>
          </div>
        </div>
      )}
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
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.displayName || 'Specialist'}
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your students today
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>FERPA Compliant</span>
          </div>
          
          <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'appointments', name: 'Appointments', icon: Calendar },
            { id: 'notes', name: 'Student Notes', icon: FileText },
            { id: 'plans', name: 'Intervention Plans', icon: Target },
            { id: 'analytics', name: 'Analytics', icon: BarChart3 },
            { id: 'resources', name: 'Resources', icon: Lightbulb },
            { id: 'communications', name: 'Communications', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'appointments' && <AppointmentManagement />}
        {activeTab === 'notes' && <StudentNotesManagement />}
        {activeTab === 'plans' && <InterventionPlansManagement />}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Detailed analytics and reporting features coming soon.</p>
          </div>
        )}
        {activeTab === 'resources' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Resource Library</h3>
            <p className="text-gray-600">Resource management and sharing features coming soon.</p>
          </div>
        )}
        {activeTab === 'communications' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Logs</h3>
            <p className="text-gray-600">Communication tracking and logging features coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialistDashboard;

