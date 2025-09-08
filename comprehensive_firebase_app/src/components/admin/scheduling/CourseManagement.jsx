import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../AuthProvider';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../../lib/adminFirebase';
import { Plus, Edit, Trash2 } from 'lucide-react';

const CourseManagement = () => {
    const { user, userProfile } = useAuth();
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState(null);

    const loadCourses = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (userProfile?.tenantId) {
                const courseData = await getCourses(userProfile.tenantId);
                setCourses(courseData);
            }
        } catch (err) {
            setError("Failed to load courses.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.tenantId]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const handleOpenModal = (course = null) => {
        setCurrentCourse(course);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCourse(null);
    };

    const handleSaveCourse = async (courseData) => {
        try {
            if (currentCourse) {
                await updateCourse(currentCourse.id, courseData);
            } else {
                await createCourse({ ...courseData, tenantId: userProfile.tenantId });
            }
            await loadCourses();
            handleCloseModal();
        } catch (err) {
            setError("Failed to save course.");
            console.error(err);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await deleteCourse(courseId);
                await loadCourses();
            } catch (err) {
                setError("Failed to delete course.");
                console.error(err);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Course Management</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Course
                </button>
            </div>
            {isLoading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> :
                <CourseList courses={courses} onEdit={handleOpenModal} onDelete={handleDeleteCourse} />
            }
            {isModalOpen && (
                <CourseModal
                    course={currentCourse}
                    onClose={handleCloseModal}
                    onSave={handleSaveCourse}
                />
            )}
        </div>
    );
};

const CourseList = ({ courses, onEdit, onDelete }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {courses.map(course => (
                    <tr key={course.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{course.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{course.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{course.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button onClick={() => onEdit(course)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit/></button>
                            <button onClick={() => onDelete(course.id)} className="text-red-600 hover:text-red-900"><Trash2/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CourseModal = ({ course, onClose, onSave }) => {
    const [name, setName] = useState(course?.name || '');
    const [code, setCode] = useState(course?.code || '');
    const [description, setDescription] = useState(course?.description || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, code, description });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">{course ? 'Edit Course' : 'Add Course'}</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Course Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <input type="text" placeholder="Course Code" value={code} onChange={e => setCode(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 mb-4 border rounded" />
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{course ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseManagement;
