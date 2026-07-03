import React from 'react';
import { Award } from 'lucide-react';

const CreditProgressWidget = ({ credits }) => {
  const total = credits?.totalCredits || 0;
  const byType = credits?.creditsByType || {};
  const types = Object.entries(byType);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Award className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total credits earned</p>
        </div>
      </div>
      {types.length > 0 ? (
        <div className="space-y-2">
          {types.map(([type, amount]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 capitalize">{type}</span>
              <span className="font-medium text-gray-900">{amount}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Credits will appear here as you complete seminars.</p>
      )}
    </div>
  );
};

export default CreditProgressWidget;
