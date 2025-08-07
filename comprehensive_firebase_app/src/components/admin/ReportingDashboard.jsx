import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  getReports,
  createReport,
  runReport,
  getReportResults,
  getSystemAnalytics
} from '../../lib/adminFirebase';
import { 
  BarChart3,
  Plus,
  Play,
  Download,
  Calendar,
  Filter,
  Search,
  FileText,
  Users,
  GraduationCap,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Loader
} from 'lucide-react';

const ReportingDashboard = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportResults, setReportResults] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [runningReports, setRunningReports] = useState(new Set());

  useEffect(() => {
    loadReportingData();
  }, [userProfile]);

  const loadReportingData = async () => {
    try {
      setLoading(true);
      const [reportsData, analyticsData] = await Promise.all([
        getReports(userProfile?.tenantId),
        getSystemAnalytics(userProfile?.tenantId)
      ]);
      
      setReports(reportsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading reporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (reportData) => {
    try {
      await createReport({
        ...reportData,
        tenantId: userProfile?.tenantId
      });
      setShowCreateModal(false);
      loadReportingData();
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Error creating report: ' + error.message);
    }
  };

  const handleRunReport = async (reportId) => {
    try {
      setRunningReports(prev => new Set([...prev, reportId]));
      const result = await runReport(reportId);
      
      // Load updated results
      const results = await getReportResults(reportId);
      setReportResults(results);
      
      alert('Report generated successfully');
    } catch (error) {
      console.error('Error running report:', error);
      alert('Error running report: ' + error.message);
    } finally {
      setRunningReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
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
      {change && (
        <div className="mt-4 flex items-center">
          {change > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(change)}% from last month
          </span>
        </div>
      )}
    </div>
  );

  const ReportCard = ({ report }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{report.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
            <span>Type: {report.type}</span>
            <span>Created: {new Date(report.createdAt?.toDate()).toLocaleDateString()}</span>
            {report.lastRunAt && (
              <span>Last run: {new Date(report.lastRunAt?.toDate()).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleRunReport(report.id)}
            disabled={runningReports.has(report.id)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {runningReports.has(report.id) ? (
              <Loader className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run
          </button>
          <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const CreateReportModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      type: 'user_summary',
      parameters: {},
      schedule: {
        enabled: false,
        frequency: 'weekly',
        dayOfWeek: 1
      }
    });

    const reportTypes = [
      { value: 'user_summary', label: 'User Summary Report' },
      { value: 'credit_tracking', label: 'Credit Tracking Report' },
      { value: 'attendance_summary', label: 'Attendance Summary Report' },
      { value: 'system_usage', label: 'System Usage Report' },
      { value: 'enrollment_analytics', label: 'Enrollment Analytics' },
      { value: 'performance_metrics', label: 'Performance Metrics' }
    ];

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
      setFormData({
        name: '',
        description: '',
        type: 'user_summary',
        parameters: {},
        schedule: {
          enabled: false,
          frequency: 'weekly',
          dayOfWeek: 1
        }
      });
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create New Report</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Monthly User Activity Report"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of what this report contains"
              />
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Schedule (Optional)</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.schedule.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, enabled: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable automatic scheduling</span>
                </label>
                
                {formData.schedule.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={formData.schedule.frequency}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, frequency: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    {formData.schedule.frequency === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Day of Week
                        </label>
                        <select
                          value={formData.schedule.dayOfWeek}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            schedule: { ...prev.schedule, dayOfWeek: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                          <option value={0}>Sunday</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Report
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
          <h2 className="text-xl font-semibold text-gray-900">Reporting Dashboard</h2>
          <p className="text-gray-600">Generate and manage system reports and analytics</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={analytics.users?.total || 0}
          change={12}
          icon={Users}
          color="bg-blue-600"
          subtitle={`${analytics.users?.active || 0} active`}
        />
        <MetricCard
          title="System Activity"
          value={analytics.activity?.logins || 0}
          change={8}
          icon={Activity}
          color="bg-green-600"
          subtitle="Logins this month"
        />
        <MetricCard
          title="Reports Generated"
          value={reports.length}
          change={-3}
          icon={FileText}
          color="bg-purple-600"
          subtitle="Total reports"
        />
        <MetricCard
          title="System Uptime"
          value={`${analytics.performance?.uptime || 99.9}%`}
          change={0.1}
          icon={CheckCircle}
          color="bg-orange-600"
          subtitle="Last 30 days"
        />
      </div>

      {/* Quick Reports */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'User Activity', type: 'user_summary', icon: Users, color: 'bg-blue-600' },
            { name: 'Credit Summary', type: 'credit_tracking', icon: GraduationCap, color: 'bg-green-600' },
            { name: 'Attendance Report', type: 'attendance_summary', icon: Clock, color: 'bg-purple-600' },
            { name: 'System Usage', type: 'system_usage', icon: BarChart3, color: 'bg-orange-600' }
          ].map(quickReport => {
            const Icon = quickReport.icon;
            return (
              <button
                key={quickReport.type}
                onClick={() => handleRunReport(quickReport.type)}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quickReport.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{quickReport.name}</h4>
                  <p className="text-sm text-gray-600">Generate now</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved Reports */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Saved Reports</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h4>
              <p className="text-gray-600">Create your first report to get started with analytics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Report Results */}
      {reportResults.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Results</h3>
          <div className="space-y-3">
            {reportResults.slice(0, 5).map(result => (
              <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Report Result</h4>
                  <p className="text-sm text-gray-600">
                    Generated: {new Date(result.createdAt?.toDate()).toLocaleString()}
                  </p>
                </div>
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      <CreateReportModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateReport}
      />
    </div>
  );
};

export default ReportingDashboard;

