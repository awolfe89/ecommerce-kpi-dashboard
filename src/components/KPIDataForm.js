import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const KPIDataForm = ({ currentKPI, setCurrentKPI, handleAddKPI, monthNames }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg mb-6`}>
      <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {currentKPI.id ? 'Edit KPI Data' : 'Add New KPI Data'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Month <span className="text-red-500">*</span>
          </label>
          <select
            value={currentKPI.month}
            onChange={(e) => setCurrentKPI({...currentKPI, month: Number(e.target.value)})}
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            required
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Required field</p>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Sales ($)
          </label>
          <input
            type="number"
            value={currentKPI.sales || ''}
            onChange={(e) => setCurrentKPI({...currentKPI, sales: e.target.value ? Number(e.target.value) : 0})}
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter sales amount"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Users
          </label>
          <input
            type="number"
            value={currentKPI.users || ''}
            onChange={(e) => setCurrentKPI({...currentKPI, users: e.target.value ? Number(e.target.value) : 0})}
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter user count"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Session Duration (seconds)
          </label>
          <input
            type="number"
            value={currentKPI.sessionDuration || ''}
            onChange={(e) => setCurrentKPI({...currentKPI, sessionDuration: e.target.value ? Number(e.target.value) : 0})}
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter session duration"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Bounce Rate (%)
          </label>
          <input
            type="number"
            value={currentKPI.bounceRate || ''}
            onChange={(e) => setCurrentKPI({...currentKPI, bounceRate: e.target.value ? Number(e.target.value) : 0})}
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter bounce rate"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddKPI}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
      <p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Only Month is required. Empty fields will be saved as 0.
      </p>
    </div>
  );
};

export default KPIDataForm;