// src/components/layout/DashboardLayout.js
import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import DashboardHeader from '../DashboardHeader';

const DashboardLayout = ({ 
  children,
  activeTab,
  setActiveTab, 
  selectedYear, 
  years, 
  setSelectedYear, 
  onLogout,
  extra // Add this prop to include additional elements like the website selector
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <DashboardHeader 
        selectedYear={selectedYear} 
        years={years} 
        setSelectedYear={setSelectedYear} 
        onLogout={onLogout}
        extra={extra} // Pass the extra content to the header
      />
      
      {/* Tab Navigation */}
      <div className="container mx-auto mt-4 px-4 md:px-0">
        <div className={`flex flex-wrap border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === 'monthly' 
                ? `border-b-2 border-blue-500 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
            onClick={() => setActiveTab('monthly')}
          >
            Monthly Dashboard
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === 'yearly' 
                ? `border-b-2 border-blue-500 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
            onClick={() => setActiveTab('yearly')}
          >
            Multi-Year Analysis
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === 'data' 
                ? `border-b-2 border-blue-500 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
            onClick={() => setActiveTab('data')}
          >
            Data Management
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;