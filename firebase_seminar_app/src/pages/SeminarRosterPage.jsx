import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAllSeminars, getUserSeminars } from "../lib/firebase";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Download } from "lucide-react";

const RosterPage = () => {
  const { seminarId } = useParams();
  const [seminar, setSeminar] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      // Fetch enrolled students from enrollments collection
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
      setError("Failed to fetch roster data");
      console.error('Error fetching roster:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Simple CSV export since we don't have XLSX library
    const csvContent = [
      ['Student ID', 'Enrollment Date'].join(','),
      ...students.map((enrollment) => [
        enrollment.studentId,
        new Date(enrollment.enrolledAt?.toDate()).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster_${seminar?.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roster...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">{seminar?.title}</h1>
            <p className="text-gray-600">Hour {seminar?.hour} - Room {seminar?.location}</p>
          </div>
          <button 
            onClick={exportToExcel} 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export Roster
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Enrolled Students ({students.length})
            </h2>
          </div>
          
          {students.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No students enrolled yet</p>
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Enrolled
                    </span>
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

export default RosterPage;