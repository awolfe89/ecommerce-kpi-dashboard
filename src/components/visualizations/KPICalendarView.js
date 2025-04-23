// src/components/visualizations/KPICalendarView.js
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

const KPICalendarView = ({ data, selectedMetric = 'sales', websiteName }) => {
  const { darkMode } = useContext(ThemeContext);
  const [metric, setMetric] = useState(selectedMetric);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getMetricValue = (month) => {
    const monthData = data.find(item => item.month === month);
    if (!monthData) return null;
    
    switch (metric) {
      case 'sales':
        return { value: monthData.sales, format: 'currency' };
      case 'users':
        return { value: monthData.users, format: 'number' };
      case 'sessionDuration':
        return { value: monthData.sessionDuration, format: 'time' };
      case 'bounceRate':
        return { value: monthData.bounceRate, format: 'percent' };
      default:
        return null;
    }
  };
  
  const formatMetricValue = (metricData) => {
    if (!metricData || metricData.value === null || metricData.value === undefined) {
      return 'No data';
    }
    
    switch (metricData.format) {
      case 'currency':
        return `$${metricData.value.toLocaleString()}`;
      case 'number':
        return metricData.value.toLocaleString();
      case 'time':
        return `${metricData.value}s`;
      case 'percent':
        return `${metricData.value}%`;
      default:
        return metricData.value;
    }
  };
  
  // Color scale
  const getColorClass = (metricData) => {
    if (!metricData || metricData.value === null || metricData.value === undefined) {
      return darkMode ? 'bg-gray-700' : 'bg-gray-100';
    }
    
    // Get all values for this metric
    const allValues = data
      .map(item => item[metric])
      .filter(val => val !== null && val !== undefined);
    
    if (allValues.length === 0) return darkMode ? 'bg-gray-700' : 'bg-gray-100';
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    
    // If all values are the same
    if (range === 0) return darkMode ? 'bg-blue-700' : 'bg-blue-500';
    
    const normalizedValue = (metricData.value - minValue) / range;
    
    // For bounce rate, lower is better
    const adjustedValue = metric === 'bounceRate' ? 1 - normalizedValue : normalizedValue;
    
    if (adjustedValue < 0.25) return darkMode ? 'bg-red-900' : 'bg-red-200';
    if (adjustedValue < 0.5) return darkMode ? 'bg-yellow-800' : 'bg-yellow-200';
    if (adjustedValue < 0.75) return darkMode ? 'bg-green-800' : 'bg-green-200';
    return darkMode ? 'bg-green-700' : 'bg-green-500';
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Monthly KPI Calendar - {websiteName}
        </h2>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button 
            onClick={() => setMetric('sales')}
            className={`px-3 py-1 text-sm rounded-md ${
              metric === 'sales' 
                ? 'bg-blue-600 text-white' 
                : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
            }`}
          >
            Sales
          </button>
          <button 
            onClick={() => setMetric('users')}
            className={`px-3 py-1 text-sm rounded-md ${
              metric === 'users' 
                ? 'bg-blue-600 text-white' 
                : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
            }`}
          >
            Users
          </button>
          <button 
            onClick={() => setMetric('sessionDuration')}
            className={`px-3 py-1 text-sm rounded-md ${
              metric === 'sessionDuration' 
                ? 'bg-blue-600 text-white' 
                : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
            }`}
          >
            Session
          </button>
          <button 
            onClick={() => setMetric('bounceRate')}
            className={`px-3 py-1 text-sm rounded-md ${
              metric === 'bounceRate' 
                ? 'bg-blue-600 text-white' 
                : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
            }`}
          >
            Bounce
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {monthNames.map((month, idx) => {
          const monthNum = idx + 1;
          const metricData = getMetricValue(monthNum);
          return (
            <div 
              key={idx} 
              className={`rounded-lg p-4 ${getColorClass(metricData)}`}
            >
              <div className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {month}
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatMetricValue(metricData)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPICalendarView;