import React, { useState } from 'react';
import { Calendar, BookOpen, User, Users } from 'lucide-react';
import CourseManagement from './scheduling/CourseManagement';
import ClassScheduleManagement from './scheduling/ClassScheduleManagement';
import TeacherScheduleManagement from './scheduling/TeacherScheduleManagement';
import StudentScheduleManagement from './scheduling/StudentScheduleManagement';

const SchedulingDashboard = () => {
    const [activeTab, setActiveTab] = useState('courses');

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'courses':
                return <CourseManagement />;
            case 'classSchedules':
                return <ClassScheduleManagement />;
            case 'teacherSchedules':
                return <TeacherScheduleManagement />;
            case 'studentSchedules':
                return <StudentScheduleManagement />;
            default:
                return <p>Select a category to manage schedules.</p>;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Full Scheduling Abilities</h1>
            <div className="flex border-b">
                <button onClick={() => setActiveTab('courses')} className={`flex items-center space-x-2 py-2 px-4 border-b-2 ${activeTab === 'courses' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}>
                    <BookOpen />
                    <span>Courses</span>
                </button>
                <button onClick={() => setActiveTab('classSchedules')} className={`flex items-center space-x-2 py-2 px-4 border-b-2 ${activeTab === 'classSchedules' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}>
                    <Calendar />
                    <span>Class Schedules</span>
                </button>
                <button onClick={() => setActiveTab('teacherSchedules')} className={`flex items-center space-x-2 py-2 px-4 border-b-2 ${activeTab === 'teacherSchedules' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}>
                    <User />
                    <span>Teacher Schedules</span>
                </button>
                <button onClick={() => setActiveTab('studentSchedules')} className={`flex items-center space-x-2 py-2 px-4 border-b-2 ${activeTab === 'studentSchedules' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}>
                    <Users />
                    <span>Student Schedules</span>
                </button>
            </div>
            <div className="mt-6">
                {renderActiveTab()}
            </div>
        </div>
    );
};

export default SchedulingDashboard;
