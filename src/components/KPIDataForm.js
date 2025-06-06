import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import Tooltip from './Tooltip';

const KPIDataForm = ({ currentKPI, setCurrentKPI, handleAddKPI, monthNames, isSaving }) => {
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
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-1`}>
            Sales ($)
            <Tooltip content="Total sales revenue for the month in USD">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </label>
          <input
            type="number"
            value={currentKPI.sales || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : 0;
              setCurrentKPI({...currentKPI, sales: Math.max(0, value)});
            }}
            min="0"
            step="0.01"
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter sales amount"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-1`}>
            Users
            <Tooltip content="Total unique visitors for the month">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </label>
          <input
            type="number"
            value={currentKPI.users || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : 0;
              setCurrentKPI({...currentKPI, users: Math.max(0, Math.round(value))});
            }}
            min="0"
            step="1"
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter user count"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-1`}>
            Session Duration (seconds)
            <Tooltip content="Average time users spend on the site per session">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </label>
          <input
            type="number"
            value={currentKPI.sessionDuration || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : 0;
              setCurrentKPI({...currentKPI, sessionDuration: Math.max(0, value)});
            }}
            min="0"
            step="1"
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter session duration"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-1`}>
            Bounce Rate (%)
            <Tooltip content="Percentage of visitors who leave after viewing only one page (0-100%)">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </label>
          <input
            type="number"
            value={currentKPI.bounceRate || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : 0;
              // Bounce rate should be between 0 and 100
              setCurrentKPI({...currentKPI, bounceRate: Math.max(0, Math.min(100, value))});
            }}
            min="0"
            max="100"
            step="0.1"
            className={`w-full rounded-md border px-3 py-2 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'border-gray-300 text-gray-700'
            }`}
            placeholder="Enter bounce rate (0-100)"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddKPI}
            disabled={isSaving}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className={`text-sm mt-4 space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>• Only Month is required. Empty fields will be saved as 0.</p>
        <p>• Sales values should be in USD without commas or currency symbols.</p>
        <p>• For Shopify-connected sites, data can be synced automatically.</p>
      </div>
    </div>
  );
};

export default KPIDataForm;