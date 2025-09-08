import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '../../lib/adminFirebase';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';

const MeetingScheduling = () => {
    const { user, userProfile } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState(null);

    const loadMeetings = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const meetingData = await getMeetings(userProfile.tenantId, {});
                setMeetings(meetingData);
            }
        } catch (err) {
            setError("Failed to load meetings.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId]);

    useEffect(() => {
        loadMeetings();
    }, [loadMeetings]);

    const handleOpenModal = (meeting = null) => {
        setCurrentMeeting(meeting);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMeeting(null);
    };

    const handleSaveMeeting = async (meetingData) => {
        try {
            if (currentMeeting) {
                await updateMeeting(currentMeeting.id, meetingData);
            } else {
                await createMeeting({ ...meetingData, tenantId: userProfile.tenantId });
            }
            await loadMeetings();
            handleCloseModal();
        } catch (err) {
            setError("Failed to save meeting.");
            console.error(err);
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            try {
                await deleteMeeting(meetingId);
                await loadMeetings();
            } catch (err) {
                setError("Failed to delete meeting.");
                console.error(err);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Meeting Scheduling</h1>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Schedule Meeting
                </button>
            </div>
            {/* A full calendar view would be implemented here, e.g., using a library like FullCalendar */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-4">Upcoming Meetings</h2>
                {isLoading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> :
                    <MeetingList meetings={meetings} onEdit={handleOpenModal} onDelete={handleDeleteMeeting} />
                }
            </div>
            {isModalOpen && (
                <MeetingModal
                    meeting={currentMeeting}
                    onClose={handleCloseModal}
                    onSave={handleSaveMeeting}
                />
            )}
        </div>
    );
};

const MeetingList = ({ meetings, onEdit, onDelete }) => (
    <ul className="divide-y divide-gray-200">
        {meetings.map(meeting => (
            <li key={meeting.id} className="p-4 flex justify-between items-center">
                <div>
                    <p className="font-bold">{meeting.title}</p>
                    <p>With: {meeting.parentName} and {meeting.teacherName}</p>
                    <p>When: {new Date(meeting.startTime.seconds * 1000).toLocaleString()} - {new Date(meeting.endTime.seconds * 1000).toLocaleTimeString()}</p>
                </div>
                <div>
                    <button onClick={() => onEdit(meeting)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit/></button>
                    <button onClick={() => onDelete(meeting.id)} className="text-red-600 hover:text-red-900"><Trash2/></button>
                </div>
            </li>
        ))}
    </ul>
);

const MeetingModal = ({ meeting, onClose, onSave }) => {
    const [title, setTitle] = useState(meeting?.title || '');
    const [parentName, setParentName] = useState(meeting?.parentName || '');
    const [teacherName, setTeacherName] = useState(meeting?.teacherName || '');
    const [startTime, setStartTime] = useState(meeting ? new Date(meeting.startTime.seconds * 1000).toISOString().slice(0, 16) : '');
    const [endTime, setEndTime] = useState(meeting ? new Date(meeting.endTime.seconds * 1000).toISOString().slice(0, 16) : '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ title, parentName, teacherName, startTime: new Date(startTime), endTime: new Date(endTime) });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">Schedule a New Meeting</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="text" placeholder="Parent Name" value={parentName} onChange={e => setParentName(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="text" placeholder="Teacher Name" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingScheduling;
