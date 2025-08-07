import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  getSystemAnalytics,
  getUsers,
  getTenants,
  getSystemLogs,
  getReports
} from '../../lib/adminFirebase';
import UserManagement from './UserManagement';
import TenantManagement from './TenantManagement';
import SystemConfiguration from './SystemConfiguration';
import ReportingDashboard from './ReportingDashboard';
import SystemLogs from './SystemLogs';
import { 
  Users,
  Building2,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  Wifi,
  HardDrive,
  Cpu,
  Monitor,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Globe,
  Lock,
  Loader
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (user && userProfile?.role === 'admin') {
      loadDashboardData();
    }
  }, [user, userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [
        analyticsData,
        usersData,
        tenantsData,
        logsData,
        reportsData
      ] = await Promise.all([
        getSystemAnalytics(userProfile?.tenantId),
        getUsers({}, { limitCount: 10 }),
        getTenants(),
        getSystemLogs(userProfile?.tenantId, {}),
        getReports(userProfile?.tenantId)
      ]);

      setAnalytics(analyticsData);
      setRecentUsers(usersData.users);
      setTenants(tenantsData);
      setRecentLogs(logsData.slice(0, 10));
      setReports(reportsData.slice(0, 5));

      // Mock system health data
      setSystemHealth({
        status: 'healthy',
        uptime: 99.9,
        responseTime: 245,
        errorRate: 0.1,
        activeConnections: 1247,
        memoryUsage: 68,
        cpuUsage: 42,
        diskUsage: 34,
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, onClick }) => (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
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
      </div>
    </button>
  );

  const SystemHealthCard = ({ title, value, status, icon: Icon }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          status === 'good' ? 'bg-green-500' :
          status === 'warning' ? 'bg-yellow-500' :
          'bg-red-500'
        }`}></div>
      </div>
    </div>
  );

  const UserCard = ({ user }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
        <span className="text-white text-sm font-medium">
          {user.displayName?.charAt(0) || 'U'}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{user.displayName}</p>
        <p className="text-xs text-gray-600">{user.email}</p>
        <p className="text-xs text-gray-500">{user.role}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        user.status === 'active' ? 'bg-green-100 text-green-800' :
        user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
        'bg-red-100 text-red-800'
      }`}>
        {user.status}
      </span>
    </div>
  );

  const LogCard = ({ log }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <Activity className="h-5 w-5 text-blue-600" />
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{log.action}</p>
        <p className="text-xs text-gray-600">{log.entityType}</p>
        <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        log.action.includes('created') ? 'bg-green-100 text-green-800' :
        log.action.includes('updated') ? 'bg-blue-100 text-blue-800' :
        log.action.includes('deleted') ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {log.action}
      </span>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">All Systems Operational</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SystemHealthCard
            title="Uptime"
            value={`${systemHealth.uptime}%`}
            status="good"
            icon={Server}
          />
          <SystemHealthCard
            title="Response Time"
            value={`${systemHealth.responseTime}ms`}
            status="good"
            icon={Wifi}
          />
          <SystemHealthCard
            title="Memory Usage"
            value={`${systemHealth.memoryUsage}%`}
            status="good"
            icon={HardDrive}
          />
          <SystemHealthCard
            title="CPU Usage"
            value={`${systemHealth.cpuUsage}%`}
            status="good"
            icon={Cpu}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analytics.users?.total || 0}
          icon={Users}
          color="bg-blue-600"
          subtitle={`${analytics.users?.active || 0} active`}
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          title="Active Tenants"
          value={tenants.filter(t => t.status === 'active').length}
          icon={Building2}
          color="bg-green-600"
          subtitle={`${tenants.length} total`}
          onClick={() => setActiveTab('tenants')}
        />
        <StatCard
          title="System Logs"
          value={recentLogs.length}
          icon={FileText}
          color="bg-purple-600"
          subtitle="Last 24 hours"
          onClick={() => setActiveTab('logs')}
        />
        <StatCard
          title="Reports Generated"
          value={reports.length}
          icon={BarChart3}
          color="bg-orange-600"
          subtitle="This month"
          onClick={() => setActiveTab('reports')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Create User"
            description="Add a new user to the system"
            icon={Users}
            color="bg-blue-600"
            onClick={() => setActiveTab('users')}
          />
          <QuickActionCard
            title="System Settings"
            description="Configure system parameters"
            icon={Settings}
            color="bg-green-600"
            onClick={() => setActiveTab('settings')}
          />
          <QuickActionCard
            title="Generate Report"
            description="Create custom system report"
            icon={BarChart3}
            color="bg-purple-600"
            onClick={() => setActiveTab('reports')}
          />
          <QuickActionCard
            title="View Logs"
            description="Monitor system activity"
            icon={Activity}
            color="bg-orange-600"
            onClick={() => setActiveTab('logs')}
          />
          <QuickActionCard
            title="Backup System"
            description="Create system backup"
            icon={Download}
            color="bg-indigo-600"
            onClick={() => {}}
          />
          <QuickActionCard
            title="Security Audit"
            description="Review security settings"
            icon={Shield}
            color="bg-red-600"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <button
              onClick={() => setActiveTab('users')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.slice(0, 5).map(user => (
                <UserCard key={user.id} user={user} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent users</p>
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <button
              onClick={() => setActiveTab('logs')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentLogs.length > 0 ? (
              recentLogs.slice(0, 5).map(log => (
                <LogCard key={log.id} log={log} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {systemHealth.activeConnections}
            </div>
            <div className="text-sm text-gray-600">Active Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {systemHealth.errorRate}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatDate(systemHealth.lastBackup)}
            </div>
            <div className="text-sm text-gray-600">Last Backup</div>
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
          <h1 className="text-2xl font-bold text-gray-900">
            System Administration
          </h1>
          <p className="text-gray-600">
            Manage users, system settings, and monitor platform health
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>Admin Access</span>
          </div>
          
          <button 
            onClick={loadDashboardData}
            className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Monitor },
            { id: 'users', name: 'User Management', icon: Users },
            { id: 'tenants', name: 'Tenants', icon: Building2 },
            { id: 'settings', name: 'System Settings', icon: Settings },
            { id: 'reports', name: 'Reports', icon: BarChart3 },
            { id: 'logs', name: 'System Logs', icon: FileText },
            { id: 'security', name: 'Security', icon: Shield }
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
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'tenants' && <TenantManagement />}
        {activeTab === 'settings' && <SystemConfiguration />}
        {activeTab === 'reports' && <ReportingDashboard />}
        {activeTab === 'logs' && <SystemLogs />}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Security Management</h3>
            <p className="text-gray-600">Advanced security features and audit tools coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

