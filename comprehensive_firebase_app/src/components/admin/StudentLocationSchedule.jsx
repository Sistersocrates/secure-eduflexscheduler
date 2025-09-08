import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { getStudentLocationSchedule } from '../../lib/adminFirebase';
import { Clock, Search } from 'lucide-react';

const StudentLocationSchedule = () => {
    const { user, userProfile } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        time: new Date().toTimeString().slice(0, 5),
        search: '',
    });

    const loadSchedule = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const scheduleData = await getStudentLocationSchedule(userProfile.tenantId, filters);
                setSchedule(scheduleData);
            }
        } catch (err) {
            setError("Failed to load student location schedule.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId, filters]);

    useEffect(() => {
        loadSchedule();
    }, [loadSchedule]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Location Schedule</h1>

            <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <input
                        type="time"
                        name="time"
                        value={filters.time}
                        onChange={handleFilterChange}
                        className="border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        name="search"
                        placeholder="Search student or location..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="border-gray-300 rounded-md shadow-sm w-64"
                    />
                </div>
                <button onClick={loadSchedule} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Search
                </button>
            </div>

            {isLoading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> :
                <ScheduleTable schedule={schedule} />
            }
        </div>
    );
};

const ScheduleTable = ({ schedule }) => (
    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map(item => (
                    <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{item.studentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.time}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default StudentLocationSchedule;
