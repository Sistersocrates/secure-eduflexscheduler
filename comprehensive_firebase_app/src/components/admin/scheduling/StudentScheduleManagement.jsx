import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../AuthProvider';
import { getUsers, getStudentSchedules, enrollStudentInClass } from '../../../lib/adminFirebase';
import { Plus } from 'lucide-react';

const StudentScheduleManagement = () => {
    const { user, userProfile } = useAuth();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const { users } = await getUsers({ role: 'student', tenantId: userProfile.tenantId });
                setStudents(users);
                if (users.length > 0) {
                    setSelectedStudent(users[0]);
                }
            }
        } catch (err) {
            setError("Failed to load students.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    useEffect(() => {
        const loadSchedule = async () => {
            if (selectedStudent) {
                const scheduleData = await getStudentSchedules(userProfile.tenantId, selectedStudent.id);
                setSchedule(scheduleData);
            }
        };
        loadSchedule();
    }, [selectedStudent, userProfile?.tenantId]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Student Schedule Management</h2>
            <div className="flex justify-between items-center mb-4">
                <select
                    onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value))}
                    className="p-2 border rounded"
                    value={selectedStudent?.id || ''}
                >
                    {students.map(student => (
                        <option key={student.id} value={student.id}>{student.displayName}</option>
                    ))}
                </select>
                <button onClick={() => {
                    const classId = prompt("Enter Class ID to enroll:");
                    if (classId) {
                        enrollStudentInClass(selectedStudent.id, classId);
                    }
                }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" />
                    Enroll in Class
                </button>
            </div>
            {isLoading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> :
                <ScheduleView schedule={schedule} />
            }
        </div>
    );
};

const ScheduleView = ({ schedule }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map(item => (
                    <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{item.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.courseName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.teacherName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.room}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default StudentScheduleManagement;
