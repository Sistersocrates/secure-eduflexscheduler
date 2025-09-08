import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { getParentTours, createParentTour, updateParentTour } from '../../lib/adminFirebase';
import { Calendar, Plus, Users, Clock, Edit, Trash, AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const ParentTours = () => {
    const { user, userProfile } = useAuth();
    const [tours, setTours] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentTour, setCurrentTour] = useState(null);
    const [selectedTourForDetails, setSelectedTourForDetails] = useState(null);

    const loadTours = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const tourData = await getParentTours(userProfile.tenantId);
                setTours(tourData);
            }
        } catch (err) {
            setError("Failed to load tours. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId]);

    useEffect(() => {
        loadTours();
    }, [loadTours]);

    const handleOpenModal = (tour = null) => {
        setCurrentTour(tour);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTour(null);
    };

    const handleOpenDetailsModal = (tour) => {
        setSelectedTourForDetails(tour);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedTourForDetails(null);
    };

    const handleSaveTour = async (tourData) => {
        try {
            if (currentTour?.id) {
                await updateParentTour(currentTour.id, tourData);
            } else {
                await createParentTour({ ...tourData, tenantId: userProfile.tenantId });
            }
            await loadTours();
            handleCloseModal();
        } catch (err) {
            setError("Failed to save tour.");
            console.error(err);
        }
    };

    const handleDeleteTour = async (tourId) => {
        if (window.confirm("Are you sure you want to delete this tour?")) {
            try {
                // Assuming a delete function exists or needs to be added to adminFirebase.js
                // For now, we'll just update the status to 'cancelled'
                await updateParentTour(tourId, { status: 'cancelled' });
                await loadTours();
            } catch (err) {
                setError("Failed to delete tour.");
                console.error(err);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Parent Tours Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Tour
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="text-center">
                    <p>Loading tours...</p>
                </div>
            ) : (
                <div className="bg-white p-4 rounded-lg shadow">
                    <TourList
                        tours={tours}
                        onEdit={handleOpenModal}
                        onDelete={handleDeleteTour}
                        onViewDetails={handleOpenDetailsModal}
                    />
                </div>
            )}

            {isModalOpen && (
                <TourModal
                    tour={currentTour}
                    onClose={handleCloseModal}
                    onSave={handleSaveTour}
                />
            )}

            {isDetailsModalOpen && (
                <TourDetailsModal
                    tour={selectedTourForDetails}
                    onClose={handleCloseDetailsModal}
                />
            )}
        </div>
    );
};

const TourList = ({ tours, onEdit, onDelete, onViewDetails }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sign-ups</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {tours.map(tour => (
                    <tr key={tour.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(tour.tourDate.seconds * 1000).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tour.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                tour.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                tour.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {tour.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tour.signups?.length || 0} / {tour.capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => onViewDetails(tour)} className="text-indigo-600 hover:text-indigo-900 mr-4">Details</button>
                            <button onClick={() => onEdit(tour)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                            <button onClick={() => onDelete(tour.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TourModal = ({ tour, onClose, onSave }) => {
    const [title, setTitle] = useState(tour?.title || '');
    const [description, setDescription] = useState(tour?.description || '');
    const [tourDate, setTourDate] = useState(tour ? new Date(tour.tourDate.seconds * 1000).toISOString().slice(0, 16) : '');
    const [capacity, setCapacity] = useState(tour?.capacity || 10);
    const [googleCalendarEventId, setGoogleCalendarEventId] = useState(tour?.googleCalendarEventId || '');


    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            title,
            description,
            tourDate: new Date(tourDate),
            capacity: Number(capacity),
            googleCalendarEventId
        });
    };

    const handleGoogleCalendarSync = () => {
        // Placeholder for Google Calendar API integration
        alert("Google Calendar sync is not implemented yet.");
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">{tour ? 'Edit Tour' : 'Create Tour'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="tourDate" className="block text-sm font-medium text-gray-700">Date and Time</label>
                        <input type="datetime-local" id="tourDate" value={tourDate} onChange={e => setTourDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
                        <input type="number" id="capacity" value={capacity} onChange={e => setCapacity(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="googleCalendarEventId" className="block text-sm font-medium text-gray-700">Google Calendar Event ID</label>
                        <input type="text" id="googleCalendarEventId" value={googleCalendarEventId} onChange={e => setGoogleCalendarEventId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{tour ? 'Update' : 'Create'}</button>
                        <button type="button" onClick={handleGoogleCalendarSync} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Sync with Google Calendar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TourDetailsModal = ({ tour, onClose }) => {
    if (!tour) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold mb-4">{tour.title}</h2>
                    <button onClick={onClose}><X className="h-6 w-6" /></button>
                </div>
                <p><strong>Date:</strong> {new Date(tour.tourDate.seconds * 1000).toLocaleString()}</p>
                <p><strong>Status:</strong> {tour.status}</p>
                <p><strong>Capacity:</strong> {tour.signups?.length || 0} / {tour.capacity}</p>
                <p className="mt-4"><strong>Description:</strong></p>
                <p>{tour.description}</p>

                <h3 className="text-lg font-bold mt-6 mb-2">Signed Up Parents</h3>
                <div className="max-h-60 overflow-y-auto">
                    <ul>
                        {tour.signups?.length > 0 ? tour.signups.map((signup, index) => (
                            <li key={index} className="border-b py-2">{signup.parentName} ({signup.parentEmail}) - {signup.numberOfAttendees} attendees</li>
                        )) : <p>No sign-ups yet.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};


export default ParentTours;
