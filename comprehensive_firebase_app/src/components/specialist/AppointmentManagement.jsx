import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  getSpecialistAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointmentRequests,
  respondToAppointmentRequest,
  getSpecialistAvailability,
  setSpecialistAvailability,
  searchStudents
} from '../../lib/specialistFirebase';
import { 
  Calendar,
  Clock,
  User,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
  Users,
  FileText,
  Star,
  MessageSquare,
  Video,
  Calendar as CalendarIcon
} from 'lucide-react';

const AppointmentManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list, requests
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    if (user) {
      loadAppointmentData();
    }
  }, [user, selectedDate]);

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      
      // Load appointments for the selected month
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const appointmentsData = await getSpecialistAppointments(user.uid, {
        start: startOfMonth,
        end: endOfMonth
      });
      setAppointments(appointmentsData);

      // Load pending appointment requests
      const requestsData = await getAppointmentRequests(user.uid, 'pending');
      setAppointmentRequests(requestsData);

      // Load availability
      const availabilityData = await getSpecialistAvailability(user.uid);
      setAvailability(availabilityData);

    } catch (error) {
      console.error('Error loading appointment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudents = async (term) => {
    if (term.length > 2) {
      try {
        const studentsData = await searchStudents(user.uid, term);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error searching students:', error);
      }
    } else {
      setStudents([]);
    }
  };

  const handleCreateAppointment = async (appointmentData) => {
    try {
      await createAppointment(user.uid, appointmentData);
      setShowCreateModal(false);
      loadAppointmentData();
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleUpdateAppointment = async (appointmentId, updates) => {
    try {
      await updateAppointment(user.uid, appointmentId, updates);
      setSelectedAppointment(null);
      loadAppointmentData();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      await cancelAppointment(user.uid, appointmentId, reason);
      setSelectedAppointment(null);
      loadAppointmentData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleRespondToRequest = async (requestId, response) => {
    try {
      await respondToAppointmentRequest(user.uid, requestId, response);
      loadAppointmentData();
    } catch (error) {
      console.error('Error responding to request:', error);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toDate().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAppointmentsByDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = apt.startTime.toDate();
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const AppointmentCard = ({ appointment, compact = false }) => (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer ${
        compact ? 'text-xs' : 'text-sm'
      }`}
      onClick={() => setSelectedAppointment(appointment)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="font-medium text-gray-900 truncate">
            {appointment.student?.displayName || 'Unknown Student'}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
          appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {appointment.status}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center text-gray-600">
          <Clock className="h-3 w-3 mr-1" />
          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </div>
        
        {appointment.location && (
          <div className="flex items-center text-gray-600">
            <MapPin className="h-3 w-3 mr-1" />
            {appointment.location}
          </div>
        )}
        
        <p className="text-gray-700 truncate">{appointment.title}</p>
      </div>
    </div>
  );

  const RequestCard = ({ request }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {request.student?.displayName || 'Unknown Student'}
            </h3>
            <p className="text-sm text-gray-600">{request.student?.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            request.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
            request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
            request.urgency === 'normal' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {request.urgency}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          Requested: {formatDate(request.requestedDate)} at {request.requestedTime}
        </div>
        
        <p className="text-sm text-gray-700">{request.reason}</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleRespondToRequest(request.id, { 
            status: 'approved',
            message: 'Appointment approved',
            appointmentData: {
              studentId: request.studentId,
              title: request.reason,
              startTime: request.requestedDate.toDate(),
              endTime: new Date(request.requestedDate.toDate().getTime() + 60 * 60 * 1000), // 1 hour
              location: 'Office'
            }
          })}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Approve
        </button>
        
        <button
          onClick={() => handleRespondToRequest(request.id, { 
            status: 'denied',
            message: 'Unable to accommodate this time slot'
          })}
          className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          <X className="h-4 w-4 mr-1" />
          Deny
        </button>
        
        <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
          <MessageSquare className="h-4 w-4 mr-1" />
          Message
        </button>
      </div>
    </div>
  );

  const CreateAppointmentModal = () => {
    const [formData, setFormData] = useState({
      studentId: '',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      appointmentType: 'individual'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateAppointment(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create Appointment</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for student..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearchStudents(e.target.value);
                  }}
                />
                {students.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {students.map(student => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, studentId: student.id });
                          setStudents([]);
                          setSearchTerm(student.displayName);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{student.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Appointment title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Appointment description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Meeting location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">Individual</option>
                <option value="group">Group</option>
                <option value="parent">Parent Conference</option>
                <option value="crisis">Crisis Intervention</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Appointment
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
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
          <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600">Manage your appointments and student meetings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="h-4 w-4 mr-1 inline" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 mr-1 inline" />
              List
            </button>
            <button
              onClick={() => setViewMode('requests')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                viewMode === 'requests' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="h-4 w-4 mr-1 inline" />
              Requests
              {appointmentRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {appointmentRequests.length}
                </span>
              )}
            </button>
          </div>
          
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Availability
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(selectedDate).map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-24"></div>;
                }
                
                const dayAppointments = getAppointmentsByDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`h-24 border border-gray-200 p-1 ${
                      isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(appointment => (
                        <div
                          key={appointment.id}
                          className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          {formatTime(appointment.startTime)} {appointment.student?.displayName}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Appointments</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {appointments.map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Requests View */}
      {viewMode === 'requests' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Appointment Requests ({appointmentRequests.length})
            </h2>
            <p className="text-gray-600">Review and respond to student appointment requests</p>
          </div>
          
          <div className="p-6">
            {appointmentRequests.length > 0 ? (
              <div className="space-y-4">
                {appointmentRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending requests
                </h3>
                <p className="text-gray-600">
                  All appointment requests have been reviewed
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateAppointmentModal />}
    </div>
  );
};

export default AppointmentManagement;

