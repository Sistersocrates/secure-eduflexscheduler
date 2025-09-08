import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { getAttendanceRecords } from '../../lib/adminFirebase';
import { Download, Calendar, Filter } from 'lucide-react';

// Mock function for exporting data
const exportAttendanceData = (data, format) => {
    console.log(`Exporting ${data.length} records to ${format}`);
    const headers = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(","), ...data.map(row => headers.map(header => row[header]).join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `attendance_export.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const AttendanceDashboard = () => {
    const { user, userProfile } = useAuth();
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
    });

    const loadAttendance = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const records = await getAttendanceRecords(userProfile.tenantId, filters);
                setAttendanceRecords(records);
            }
        } catch (err) {
            setError("Failed to load attendance records.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId, filters]);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleExport = (format) => {
        if (format === 'skyward' || format === 'infinite-campus') {
            alert(`Export to ${format} is a placeholder and would require specific formatting.`);
        }
        exportAttendanceData(attendanceRecords, 'csv');
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Attendance Management</h1>

            <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <input
                            type="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                            className="border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <button onClick={loadAttendance} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <Filter className="h-5 w-5 mr-2" />
                        Apply Filters
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleExport('csv')} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <Download className="h-5 w-5 mr-2" />
                        Export CSV
                    </button>
                    <button onClick={() => handleExport('skyward')} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                        Export for Skyward
                    </button>
                    <button onClick={() => handleExport('infinite-campus')} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                        Export for Infinite Campus
                    </button>
                </div>
            </div>

            {isLoading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> :
                <AttendanceList records={attendanceRecords} />
            }
        </div>
    );
};

const AttendanceList = ({ records }) => (
    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {records.map(record => (
                    <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{record.studentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {record.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.courseName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.recordedBy}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default AttendanceDashboard;
