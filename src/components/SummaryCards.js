// src/components/SummaryCards.js
import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const SummaryCards = ({ data, calculateAverageMonthSales, forecastYearlySales, websiteName }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="mb-6">
      <h2 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {websiteName} - Summary
      </h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Average Monthly Sales
          </h2>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ${Number(calculateAverageMonthSales()).toLocaleString()}
          </p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Forecasted Yearly Sales
          </h2>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ${Number(forecastYearlySales()).toLocaleString()}
          </p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Total Users
          </h2>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {data.reduce((sum, item) => sum + (item.users || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Avg. Bounce Rate
          </h2>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {data.length > 0 
              ? (data.reduce((sum, item) => sum + (item.bounceRate || 0), 0) / data.length).toFixed(2) + '%'
              : '0%'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;