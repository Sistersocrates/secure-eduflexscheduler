import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  getClassRoster, 
  getClassWaitlist, 
  recordAttendance, 
  getClassAttendance,
  updateAttendanceRecord,
  approveWaitlistStudent
} from '../../lib/teacherFirebase';
import { 
  Users, 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Mail,
  Phone,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Loader,
  Save,
  Edit,
  Eye,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const AttendanceManagement = ({ classId, className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('roster');
  const [roster, setRoster] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'week'
  });

  useEffect(() => {
    if (classId && user) {
      loadData();
    }
  }, [classId, user, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'roster') {
        const rosterData = await getClassRoster(user.uid, classId);
        setRoster(rosterData);
      } else if (activeTab === 'waitlist') {
        const waitlistData = await getClassWaitlist(user.uid, classId);
        setWaitlist(waitlistData);
      } else if (activeTab === 'attendance') {
        const attendanceData = await getClassAttendance(user.uid, classId, {
          dateRange: getDateRange()
        });
        setAttendance(attendanceData);
        
        // Load today's attendance for quick entry
        const todayAttendance = await getClassAttendance(user.uid, classId, {
          date: selectedDate
        });
        
        const todayRecords = {};
        todayAttendance.forEach(record => {
          todayRecords[record.studentId] = {
            id: record.id,
            status: record.status,
            notes: record.notes || ''
          };
        });
        setAttendanceRecords(todayRecords);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (filters.dateRange) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'semester':
        start.setMonth(end.getMonth() - 4);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      
      const records = roster.map(student => ({
        studentId: student.studentId,
        status: attendanceRecords[student.studentId]?.status || 'absent',
        notes: attendanceRecords[student.studentId]?.notes || ''
      }));

      await recordAttendance(user.uid, classId, {
        date: selectedDate,
        records
      });

      await loadData();
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const approveFromWaitlist = async (enrollmentId) => {
    try {
      await approveWaitlistStudent(user.uid, classId, enrollmentId);
      await loadData();
    } catch (error) {
      console.error('Error approving waitlist student:', error);
    }
  };

  const exportRoster = () => {
    const csvContent = [
      ['Name', 'Email', 'Student ID', 'Grade Level', 'Enrollment Date'],
      ...roster.map(student => [
        student.student.displayName,
        student.student.email,
        student.student.studentId,
        student.student.gradeLevel || 'N/A',
        new Date(student.enrollmentDate?.toDate()).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}_roster.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceStats = () => {
    if (attendance.length === 0) return { present: 0, absent: 0, late: 0, excused: 0 };
    
    const stats = attendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    return {
      present: stats.present || 0,
      absent: stats.absent || 0,
      late: stats.late || 0,
      excused: stats.excused || 0
    };
  };

  const filteredRoster = roster.filter(student => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        student.student.displayName.toLowerCase().includes(searchTerm) ||
        student.student.email.toLowerCase().includes(searchTerm) ||
        student.student.studentId?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  const AttendanceStatusButton = ({ status, currentStatus, onClick, label, color }) => (
    <button
      onClick={() => onClick(status)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        currentStatus === status
          ? `${color} text-white`
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  const StudentCard = ({ student, showAttendance = false }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {student.student.photoURL ? (
            <img
              src={student.student.photoURL}
              alt={student.student.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-500" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {student.student.displayName}
            </h3>
            {student.student.gradeLevel && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Grade {student.student.gradeLevel}
              </span>
            )}
          </div>
          
          <div className="mt-1 space-y-1">
            <div className="flex items-center text-xs text-gray-500">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate">{student.student.email}</span>
            </div>
            
            {student.student.studentId && (
              <div className="flex items-center text-xs text-gray-500">
                <User className="h-3 w-3 mr-1" />
                <span>ID: {student.student.studentId}</span>
              </div>
            )}
            
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Enrolled: {new Date(student.enrollmentDate?.toDate()).toLocaleDateString()}</span>
            </div>
          </div>

          {showAttendance && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2">
                <AttendanceStatusButton
                  status="present"
                  currentStatus={attendanceRecords[student.studentId]?.status}
                  onClick={(status) => handleAttendanceChange(student.studentId, 'status', status)}
                  label="Present"
                  color="bg-green-600"
                />
                <AttendanceStatusButton
                  status="late"
                  currentStatus={attendanceRecords[student.studentId]?.status}
                  onClick={(status) => handleAttendanceChange(student.studentId, 'status', status)}
                  label="Late"
                  color="bg-yellow-600"
                />
                <AttendanceStatusButton
                  status="excused"
                  currentStatus={attendanceRecords[student.studentId]?.status}
                  onClick={(status) => handleAttendanceChange(student.studentId, 'status', status)}
                  label="Excused"
                  color="bg-blue-600"
                />
                <AttendanceStatusButton
                  status="absent"
                  currentStatus={attendanceRecords[student.studentId]?.status}
                  onClick={(status) => handleAttendanceChange(student.studentId, 'status', status)}
                  label="Absent"
                  color="bg-red-600"
                />
              </div>
              
              <input
                type="text"
                placeholder="Notes (optional)"
                value={attendanceRecords[student.studentId]?.notes || ''}
                onChange={(e) => handleAttendanceChange(student.studentId, 'notes', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const WaitlistCard = ({ student }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {student.student.photoURL ? (
              <img
                src={student.student.photoURL}
                alt={student.student.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {student.student.displayName}
            </h3>
            <p className="text-xs text-gray-500">{student.student.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Position: #{student.waitlistPosition || 'N/A'} • 
              Joined: {new Date(student.enrollmentDate?.toDate()).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => approveFromWaitlist(student.id)}
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Approve
        </button>
      </div>
    </div>
  );

  const AttendanceStats = () => {
    const stats = getAttendanceStats();
    const total = stats.present + stats.absent + stats.late + stats.excused;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Present</p>
              <p className="text-2xl font-bold text-green-900">{stats.present}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-900">Absent</p>
              <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">Late</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Excused</p>
              <p className="text-2xl font-bold text-blue-900">{stats.excused}</p>
            </div>
          </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">{className}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {activeTab === 'roster' && (
            <button
              onClick={exportRoster}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Roster
            </button>
          )}
          
          {activeTab === 'attendance' && (
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Attendance
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'roster', name: 'Class Roster', icon: Users, count: roster.length },
            { id: 'waitlist', name: 'Waitlist', icon: Clock, count: waitlist.length },
            { id: 'attendance', name: 'Attendance', icon: ClipboardCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
              {tab.count !== undefined && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {activeTab === 'attendance' && (
            <>
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="semester">This Semester</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Enrolled Students ({filteredRoster.length})
            </h2>
          </div>
          
          <div className="grid gap-4">
            {filteredRoster.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
            
            {filteredRoster.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {filters.search ? 'Try adjusting your search terms' : 'No students are enrolled in this class yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Waitlisted Students ({waitlist.length})
            </h2>
          </div>
          
          <div className="grid gap-4">
            {waitlist.map((student) => (
              <WaitlistCard key={student.id} student={student} />
            ))}
            
            {waitlist.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No waitlisted students</h3>
                <p className="text-gray-600">All interested students are enrolled or no one is waiting</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <AttendanceStats />
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Take Attendance - {new Date(selectedDate).toLocaleDateString()}
              </h2>
              <div className="text-sm text-gray-500">
                {roster.length} students
              </div>
            </div>
            
            <div className="grid gap-4">
              {roster.map((student) => (
                <StudentCard key={student.id} student={student} showAttendance={true} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;

