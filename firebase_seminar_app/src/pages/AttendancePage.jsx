import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAllSeminars } from "../lib/firebase";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";

const AttendancePage = () => {
  const { seminarId } = useParams();
  const [seminar, setSeminar] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchSeminarAndStudents();
  }, [seminarId]);

  const fetchSeminarAndStudents = async () => {
    try {
      // Fetch seminar details
      const seminars = await getAllSeminars();
      const seminarData = seminars.find(s => s.id === seminarId);
      
      if (!seminarData) {
        setError("Seminar not found");
        return;
      }
      
      setSeminar(seminarData);

      // Fetch enrolled students
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('seminarId', '==', seminarId)
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollmentData = [];
      
      enrollmentsSnapshot.forEach((doc) => {
        enrollmentData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStudents(enrollmentData);
    } catch (error) {
      setError("Failed to fetch attendance data");
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600">{seminar?.title} - Hour {seminar?.hour}</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Students ({students.length})
            </h2>
          </div>
          
          {students.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No students enrolled</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((enrollment) => (
                <div key={enrollment.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Student ID: {enrollment.studentId}
                      </p>
                      <p className="text-sm text-gray-500">
                        Enrolled: {new Date(enrollment.enrolledAt?.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Present
                      </button>
                      <button className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;