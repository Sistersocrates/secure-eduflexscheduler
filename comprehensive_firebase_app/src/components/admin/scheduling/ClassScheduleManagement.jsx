import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../AuthProvider';
import { getClassSchedules, createClassSchedule, updateClassSchedule, deleteClassSchedule } from '../../../lib/adminFirebase';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ClassScheduleManagement = () => {
    const { user, userProfile } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState(null);

    const loadSchedules = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const scheduleData = await getClassSchedules(userProfile.tenantId);
                setSchedules(scheduleData);
            }
        } catch (err) {
            setError("Failed to load class schedules.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId]);

    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);

    const handleOpenModal = (schedule = null) => {
        setCurrentSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSchedule(null);
    };

    const handleSaveSchedule = async (scheduleData) => {
        try {
            if (currentSchedule) {
                await updateClassSchedule(currentSchedule.id, scheduleData);
            } else {
                await createClassSchedule({ ...scheduleData, tenantId: userProfile.tenantId });
            }
            await loadSchedules();
            handleCloseModal();
        } catch (err) {
            setError("Failed to save schedule.");
            console.error(err);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        if (window.confirm("Are you sure you want to delete this schedule?")) {
            try {
                await deleteClassSchedule(scheduleId);
                await loadSchedules();
            } catch (err) {
                setError("Failed to delete schedule.");
                console.error(err);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Class Schedule Management</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Class Schedule
                </button>
            </div>
            {isLoading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> :
                <ScheduleList schedules={schedules} onEdit={handleOpenModal} onDelete={handleDeleteSchedule} />
            }
            {isModalOpen && (
                <ScheduleModal
                    schedule={currentSchedule}
                    onClose={handleCloseModal}
                    onSave={handleSaveSchedule}
                />
            )}
        </div>
    );
};

const ScheduleList = ({ schedules, onEdit, onDelete }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map(schedule => (
                    <tr key={schedule.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{schedule.courseName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{schedule.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{schedule.teacherName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{schedule.room}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button onClick={() => onEdit(schedule)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit/></button>
                            <button onClick={() => onDelete(schedule.id)} className="text-red-600 hover:text-red-900"><Trash2/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ScheduleModal = ({ schedule, onClose, onSave }) => {
    const [courseName, setCourseName] = useState(schedule?.courseName || '');
    const [period, setPeriod] = useState(schedule?.period || '');
    const [teacherName, setTeacherName] = useState(schedule?.teacherName || '');
    const [room, setRoom] = useState(schedule?.room || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ courseName, period, teacherName, room });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">{schedule ? 'Edit Class Schedule' : 'Add Class Schedule'}</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Course Name" value={courseName} onChange={e => setCourseName(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="number" placeholder="Period" value={period} onChange={e => setPeriod(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="text" placeholder="Teacher Name" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="text" placeholder="Room" value={room} onChange={e => setRoom(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{schedule ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClassScheduleManagement;
