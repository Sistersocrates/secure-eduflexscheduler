import React, { useState } from 'react';
import CreditTracking from './CreditTracking';
import StudentLocationSchedule from './StudentLocationSchedule';
import { Book, MapPin } from 'lucide-react';

const AcademicsDashboard = () => {
    const [activeSubTab, setActiveSubTab] = useState('credits');

    return (
        <div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveSubTab('credits')}
                        className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                            activeSubTab === 'credits'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Book className="h-4 w-4" />
                        <span>Credit Tracking</span>
                    </button>
                    <button
                        onClick={() => setActiveSubTab('locations')}
                        className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                            activeSubTab === 'locations'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <MapPin className="h-4 w-4" />
                        <span>Student Locations</span>
                    </button>
                </nav>
            </div>
            <div className="mt-6">
                {activeSubTab === 'credits' && <CreditTracking />}
                {activeSubTab === 'locations' && <StudentLocationSchedule />}
            </div>
        </div>
    );
};

export default AcademicsDashboard;
