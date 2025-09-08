import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { getUsers, getStudentCredits, addStudentCredit, updateStudentCredit, deleteStudentCredit } from '../../lib/adminFirebase';
import { Book, Plus, Edit, Award, Trash2 } from 'lucide-react';


const CreditTracking = () => {
    const { user, userProfile } = useAuth();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentCredits, setStudentCredits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [currentCredit, setCurrentCredit] = useState(null);

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
        const loadCredits = async () => {
            if (selectedStudent) {
                try {
                    const credits = await getStudentCredits(selectedStudent.id);
                    setStudentCredits(credits);
                } catch (err) {
                    setError("Failed to load credits for the selected student.");
                    console.error(err);
                }
            }
        };
        loadCredits();
    }, [selectedStudent]);

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
    };

    const handleOpenCreditModal = (credit = null) => {
        setCurrentCredit(credit);
        setIsCreditModalOpen(true);
    };

    const handleCloseCreditModal = () => {
        setIsCreditModalOpen(false);
        setCurrentCredit(null);
    };

    const handleSaveCredit = async (creditData) => {
        try {
            if (currentCredit?.id) {
                await updateStudentCredit(currentCredit.id, creditData);
            } else {
                await addStudentCredit(selectedStudent.id, creditData);
            }
            const credits = await getStudentCredits(selectedStudent.id);
            setStudentCredits(credits);
            handleCloseCreditModal();
        } catch (err) {
            setError("Failed to save credit.");
            console.error(err);
        }
    };

    const handleDeleteCredit = async (creditId) => {
        if (window.confirm("Are you sure you want to delete this credit?")) {
            try {
                await deleteStudentCredit(creditId);
                const credits = await getStudentCredits(selectedStudent.id);
                setStudentCredits(credits);
            } catch (err) {
                setError("Failed to delete credit.");
                console.error(err);
            }
        }
    };


    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Credit Tracking</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <StudentList students={students} onSelectStudent={handleSelectStudent} selectedStudent={selectedStudent} />
                </div>
                <div className="md:col-span-3">
                    {selectedStudent ? (
                        <CreditDetails
                            student={selectedStudent}
                            credits={studentCredits}
                            onAddCredit={() => handleOpenCreditModal()}
                            onEditCredit={handleOpenCreditModal}
                            onDeleteCredit={handleDeleteCredit}
                        />
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <p>Select a student to view their credits.</p>
                        </div>
                    )}
                </div>
            </div>
            {isCreditModalOpen && selectedStudent && (
                <CreditModal
                    credit={currentCredit}
                    onClose={handleCloseCreditModal}
                    onSave={handleSaveCredit}
                />
            )}
        </div>
    );
};

const StudentList = ({ students, onSelectStudent, selectedStudent }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Students</h2>
        <ul className="divide-y divide-gray-200">
            {students.map(student => (
                <li
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    className={`p-3 cursor-pointer rounded-lg ${selectedStudent?.id === student.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                >
                    <p className="font-semibold">{student.displayName}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                </li>
            ))}
        </ul>
    </div>
);

const CreditDetails = ({ student, credits, onAddCredit, onEditCredit, onDeleteCredit }) => {
    const totalCredits = credits.reduce((acc, credit) => acc + credit.creditsEarned, 0);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold">{student.displayName}'s Credits</h2>
                    <p className="text-gray-600">Total Credits Earned: <span className="font-bold">{totalCredits.toFixed(2)}</span></p>
                </div>
                <button
                    onClick={onAddCredit}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Credit
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Awarded</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {credits.map(credit => (
                            <tr key={credit.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{credit.courseName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{credit.creditsEarned.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{credit.grade}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(credit.dateAwarded).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button onClick={() => onEditCredit(credit)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onDeleteCredit(credit.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CreditModal = ({ credit, onClose, onSave }) => {
    const [courseName, setCourseName] = useState(credit?.courseName || '');
    const [creditsEarned, setCreditsEarned] = useState(credit?.creditsEarned || '');
    const [grade, setGrade] = useState(credit?.grade || '');
    const [dateAwarded, setDateAwarded] = useState(credit ? new Date(credit.dateAwarded).toISOString().split('T')[0] : '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            courseName,
            creditsEarned: parseFloat(creditsEarned),
            grade,
            dateAwarded: new Date(dateAwarded),
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">{credit ? 'Edit Credit' : 'Add Credit'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">Course Name</label>
                        <input type="text" id="courseName" value={courseName} onChange={e => setCourseName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="creditsEarned" className="block text-sm font-medium text-gray-700">Credits Earned</label>
                        <input type="number" step="0.01" id="creditsEarned" value={creditsEarned} onChange={e => setCreditsEarned(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade</label>
                        <input type="text" id="grade" value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="dateAwarded" className="block text-sm font-medium text-gray-700">Date Awarded</label>
                        <input type="date" id="dateAwarded" value={dateAwarded} onChange={e => setDateAwarded(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{credit ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreditTracking;
