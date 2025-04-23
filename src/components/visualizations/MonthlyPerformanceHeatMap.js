// src/components/visualizations/MonthlyPerformanceHeatMap.js
import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

const MonthlyPerformanceHeatMap = ({ data, selectedYear, websiteName }) => {
  const { darkMode } = useContext(ThemeContext);
  
  // Calculate min/max values for color scaling
  const sales = data.map(item => item.sales);
  const minSales = Math.min(...sales);
  const maxSales = Math.max(...sales);
  
  // Color scale function (blue to red gradient)
  const getColor = (value) => {
    if (!value) return darkMode ? 'bg-gray-700' : 'bg-gray-200'; // Empty month
    
    const normalizedValue = (value - minSales) / (maxSales - minSales);
    
    if (normalizedValue < 0.25) return darkMode ? 'bg-blue-900' : 'bg-blue-200';
    if (normalizedValue < 0.5) return darkMode ? 'bg-blue-700' : 'bg-blue-400';
    if (normalizedValue < 0.75) return darkMode ? 'bg-yellow-600' : 'bg-yellow-400';
    return darkMode ? 'bg-red-700' : 'bg-red-500';
  };
  
  const getSalesForMonth = (month) => {
    const monthData = data.find(item => item.month === month);
    return monthData ? monthData.sales : null;
  };
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
      <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Monthly Sales Heatmap ({selectedYear}) - {websiteName}
      </h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
        {monthNames.map((month, idx) => {
          const monthNum = idx + 1;
          const sales = getSalesForMonth(monthNum);
          return (
            <div key={idx} className="flex flex-col items-center">
              <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {month}
              </div>
              <div 
                className={`w-full h-20 rounded ${getColor(sales)} flex items-center justify-center text-sm font-medium transition-colors duration-200`}
              >
                <div className={`text-center ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {sales ? `$${sales.toLocaleString()}` : 'No data'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center mt-4">
        <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sales Range: </div>
        <div className="flex items-center mx-2">
          <div className={`w-3 h-3 ${darkMode ? 'bg-blue-900' : 'bg-blue-200'} rounded-sm`}></div>
          <span className={`text-xs mx-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Low</span>
        </div>
        <div className="flex items-center mx-2">
          <div className={`w-3 h-3 ${darkMode ? 'bg-blue-700' : 'bg-blue-400'} rounded-sm`}></div>
        </div>
        <div className="flex items-center mx-2">
          <div className={`w-3 h-3 ${darkMode ? 'bg-yellow-600' : 'bg-yellow-400'} rounded-sm`}></div>
        </div>
        <div className="flex items-center mx-2">
          <div className={`w-3 h-3 ${darkMode ? 'bg-red-700' : 'bg-red-500'} rounded-sm`}></div>
          <span className={`text-xs mx-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>High</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPerformanceHeatMap;