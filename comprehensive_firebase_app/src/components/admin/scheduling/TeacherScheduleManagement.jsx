import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../AuthProvider';
import { getUsers, getTeacherSchedules } from '../../../lib/adminFirebase';

const TeacherScheduleManagement = () => {
    const { user, userProfile } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadTeachers = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const { users } = await getUsers({ role: 'teacher', tenantId: userProfile.tenantId });
                setTeachers(users);
                if (users.length > 0) {
                    setSelectedTeacher(users[0]);
                }
            }
        } catch (err) {
            setError("Failed to load teachers.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId]);

    useEffect(() => {
        loadTeachers();
    }, [loadTeachers]);

    useEffect(() => {
        const loadSchedule = async () => {
            if (selectedTeacher) {
                const scheduleData = await getTeacherSchedules(userProfile.tenantId, selectedTeacher.id);
                setSchedule(scheduleData);
            }
        };
        loadSchedule();
    }, [selectedTeacher, userProfile?.tenantId]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Teacher Schedule Management</h2>
            <div className="mb-4">
                <select
                    onChange={(e) => setSelectedTeacher(teachers.find(t => t.id === e.target.value))}
                    className="p-2 border rounded"
                    value={selectedTeacher?.id || ''}
                >
                    {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.displayName}</option>
                    ))}
                </select>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map(item => (
                    <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{item.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.courseName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.room}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default TeacherScheduleManagement;
