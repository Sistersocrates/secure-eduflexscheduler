import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { getSystemLogs } from '../../lib/adminFirebase';
import { 
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  User,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  ChevronDown,
  ChevronRight,
  Loader
} from 'lucide-react';

const SystemLogs = () => {
  const { userProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [pagination, setPagination] = useState({ page: 1, limit: 50, hasMore: true });

  useEffect(() => {
    loadLogs();
  }, [searchTerm, actionFilter, entityTypeFilter, dateRange]);

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      const filters = {
        action: actionFilter,
        entityType: entityTypeFilter,
        dateRange: dateRange.start && dateRange.end ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : null
      };
      
      const logsData = await getSystemLogs(userProfile?.tenantId, filters);
      
      // Filter by search term locally
      const filteredLogs = logsData.filter(log => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          log.action?.toLowerCase().includes(searchLower) ||
          log.entityType?.toLowerCase().includes(searchLower) ||
          log.details?.email?.toLowerCase().includes(searchLower) ||
          log.userId?.toLowerCase().includes(searchLower)
        );
      });
      
      if (page === 1) {
        setLogs(filteredLogs);
      } else {
        setLogs(prev => [...prev, ...filteredLogs]);
      }
      
      setPagination(prev => ({
        ...prev,
        page,
        hasMore: filteredLogs.length === 100 // Assuming we got the full limit
      }));
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getActionIcon = (action) => {
    if (action.includes('created')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes('updated')) return <Settings className="h-4 w-4 text-blue-500" />;
    if (action.includes('deleted')) return <X className="h-4 w-4 text-red-500" />;
    if (action.includes('login')) return <User className="h-4 w-4 text-purple-500" />;
    if (action.includes('error') || action.includes('failed')) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (action) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800';
    if (action.includes('deleted')) return 'bg-red-100 text-red-800';
    if (action.includes('login')) return 'bg-purple-100 text-purple-800';
    if (action.includes('error') || action.includes('failed')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date.toDate ? date.toDate() : date).toLocaleString();
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Entity Type', 'User ID', 'Details'].join(','),
      ...logs.map(log => [
        formatDate(log.createdAt),
        log.action,
        log.entityType,
        log.userId || '',
        JSON.stringify(log.details || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const LogCard = ({ log }) => {
    const isExpanded = expandedLogs.has(log.id);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {getActionIcon(log.action)}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
                <span className="text-sm text-gray-600">{log.entityType}</span>
                {log.entityId && (
                  <span className="text-xs text-gray-500">ID: {log.entityId.substring(0, 8)}...</span>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>User: {log.userId?.substring(0, 8) || 'System'}...</span>
                <span>{formatDate(log.createdAt)}</span>
                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => toggleLogExpansion(log.id)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {isExpanded && log.details && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Details:</h4>
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md overflow-x-auto">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const FilterPanel = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions</option>
          <option value="user_created">User Created</option>
          <option value="user_updated">User Updated</option>
          <option value="user_deleted">User Deleted</option>
          <option value="login_success">Login Success</option>
          <option value="login_failed">Login Failed</option>
          <option value="system_settings_updated">Settings Updated</option>
          <option value="report_generated">Report Generated</option>
        </select>
        
        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Entity Types</option>
          <option value="user">User</option>
          <option value="tenant">Tenant</option>
          <option value="settings">Settings</option>
          <option value="report">Report</option>
          <option value="seminar">Seminar</option>
          <option value="appointment">Appointment</option>
        </select>
        
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  if (loading && logs.length === 0) {
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
          <h2 className="text-xl font-semibold text-gray-900">System Logs</h2>
          <p className="text-gray-600">Monitor system activity and audit trails</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportLogs}
            className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => loadLogs()}
            className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel />

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-lg font-bold text-gray-900">{logs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Success Actions</p>
              <p className="text-lg font-bold text-gray-900">
                {logs.filter(log => !log.action.includes('failed') && !log.action.includes('error')).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Failed Actions</p>
              <p className="text-lg font-bold text-gray-900">
                {logs.filter(log => log.action.includes('failed') || log.action.includes('error')).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Unique Users</p>
              <p className="text-lg font-bold text-gray-900">
                {new Set(logs.map(log => log.userId).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {logs.length > 0 ? (
          logs.map(log => (
            <LogCard key={log.id} log={log} />
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or date range.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {pagination.hasMore && logs.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => loadLogs(pagination.page + 1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Load More Logs
          </button>
        </div>
      )}

      {/* Real-time indicator */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;

