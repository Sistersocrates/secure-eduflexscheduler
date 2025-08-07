import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, Calendar } from 'lucide-react';

const ScheduleWidget = ({ schedule = [] }) => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [currentTime, setCurrentTime] = useState(new Date());

  const days = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
  ];

  const hours = [
    { id: 1, time: '8:00 AM - 9:00 AM', label: 'Hour 1' },
    { id: 2, time: '9:00 AM - 10:00 AM', label: 'Hour 2' },
    { id: 3, time: '10:00 AM - 11:00 AM', label: 'Hour 3' },
    { id: 4, time: '11:00 AM - 12:00 PM', label: 'Hour 4' },
    { id: 5, time: '12:00 PM - 1:00 PM', label: 'Hour 5' },
    { id: 6, time: '1:00 PM - 2:00 PM', label: 'Hour 6' },
    { id: 7, time: '2:00 PM - 3:00 PM', label: 'Hour 7' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getCurrentHour = () => {
    const hour = currentTime.getHours();
    if (hour >= 8 && hour < 9) return 1;
    if (hour >= 9 && hour < 10) return 2;
    if (hour >= 10 && hour < 11) return 3;
    if (hour >= 11 && hour < 12) return 4;
    if (hour >= 12 && hour < 13) return 5;
    if (hour >= 13 && hour < 14) return 6;
    if (hour >= 14 && hour < 15) return 7;
    return null;
  };

  const getScheduleForDay = (dayId) => {
    return schedule.filter(item => {
      if (item.type === 'class') {
        return item.days && item.days.includes(dayId);
      } else if (item.type === 'appointment') {
        const appointmentDate = new Date(item.startTime.toDate());
        return appointmentDate.getDay() === dayId;
      }
      return false;
    });
  };

  const getItemForHour = (dayId, hourId) => {
    const daySchedule = getScheduleForDay(dayId);
    return daySchedule.find(item => {
      if (item.type === 'class') {
        return item.hour === hourId;
      } else if (item.type === 'appointment') {
        const appointmentDate = new Date(item.startTime.toDate());
        const appointmentHour = appointmentDate.getHours();
        
        // Map appointment time to hour slots
        if (appointmentHour >= 8 && appointmentHour < 9) return hourId === 1;
        if (appointmentHour >= 9 && appointmentHour < 10) return hourId === 2;
        if (appointmentHour >= 10 && appointmentHour < 11) return hourId === 3;
        if (appointmentHour >= 11 && appointmentHour < 12) return hourId === 4;
        if (appointmentHour >= 12 && appointmentHour < 13) return hourId === 5;
        if (appointmentHour >= 13 && appointmentHour < 14) return hourId === 6;
        if (appointmentHour >= 14 && appointmentHour < 15) return hourId === 7;
      }
      return false;
    });
  };

  const isCurrentHour = (hourId) => {
    return getCurrentHour() === hourId && selectedDay === new Date().getDay();
  };

  const getItemColor = (item) => {
    if (item.type === 'class') {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else if (item.type === 'appointment') {
      return 'bg-purple-50 border-purple-200 text-purple-800';
    }
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              selectedDay === day.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="hidden sm:inline">{day.name}</span>
            <span className="sm:hidden">{day.short}</span>
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="space-y-2">
        {hours.map((hour) => {
          const item = getItemForHour(selectedDay, hour.id);
          const isCurrent = isCurrentHour(hour.id);
          
          return (
            <div
              key={hour.id}
              className={`border rounded-lg p-4 transition-all ${
                isCurrent 
                  ? 'border-blue-300 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className={`h-4 w-4 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-900' : 'text-gray-600'
                    }`}>
                      {hour.label}
                    </span>
                    <span className={`text-xs ${
                      isCurrent ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {hour.time}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                  </div>
                  
                  {item ? (
                    <div className={`border rounded-md p-3 ${getItemColor(item)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs opacity-80 mb-2">
                              {item.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 text-xs">
                            {item.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{item.location}</span>
                              </div>
                            )}
                            
                            {item.teacher && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{item.teacher}</span>
                              </div>
                            )}
                            
                            {item.specialist && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{item.specialist}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'class' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.type === 'class' ? 'Class' : 'Appointment'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-md p-3 text-center">
                      <p className="text-sm text-gray-500">Free Period</p>
                      <button className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                        Browse Available Classes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          {days.find(d => d.id === selectedDay)?.name} Summary
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Classes:</span>
            <span className="ml-2 font-medium">
              {getScheduleForDay(selectedDay).filter(item => item.type === 'class').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Appointments:</span>
            <span className="ml-2 font-medium">
              {getScheduleForDay(selectedDay).filter(item => item.type === 'appointment').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Free Periods:</span>
            <span className="ml-2 font-medium">
              {7 - getScheduleForDay(selectedDay).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Hours:</span>
            <span className="ml-2 font-medium">7</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Calendar className="h-4 w-4 mr-2" />
          View Full Calendar
        </button>
        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Browse Classes
        </button>
        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default ScheduleWidget;

