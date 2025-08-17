import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { getAllSeminars, createSeminar } from "../lib/firebase";
import SeminarList from "../components/seminars/SeminarList";
import { Users, Clock } from "lucide-react";

const MySeminarsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMySeminars();
  }, [user]);

  const fetchMySeminars = async () => {
    try {
      setLoading(true);
      const allSeminars = await getAllSeminars();
      // Filter seminars created by current user
      const mySeminars = allSeminars.filter(seminar => seminar.createdBy === user?.uid);
      setSeminars(mySeminars);
    } catch (error) {
      setError("Failed to fetch seminars");
      console.error('Error fetching seminars:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seminars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Seminars</h1>
        <p className="text-gray-600">Manage your seminars and track student enrollment</p>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {seminars.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No seminars yet</h3>
          <p className="text-gray-600 mb-4">Create your first seminar to get started</p>
          <button
            onClick={() => navigate('/teacher/create-seminar')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Seminar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {seminars.map((seminar) => (
            <div key={seminar.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{seminar.title}</h2>
                  <p className="text-gray-600">{seminar.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Hour {seminar.hour}</span>
                    <span>Room: {seminar.location}</span>
                    <span>Capacity: {seminar.currentEnrollment || 0}/{seminar.capacity}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  seminar.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {seminar.isLocked ? 'Locked' : 'Open'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/teacher/roster/${seminar.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View Roster
                </button>
                <button
                  onClick={() => navigate(`/teacher/attendance/${seminar.id}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Attendance
                </button>
                <button
                  onClick={() => navigate(`/teacher/edit-seminar/${seminar.id}`)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySeminarsPage;