// src/components/visualizations/KPIRadarChart.js
import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';

const KPIRadarChart = ({ data, websiteName }) => {
  const { darkMode } = useContext(ThemeContext);
  
  // Calculate metric ranges
  const calculateMetricRange = (metricName) => {
    const values = data.map(item => item[metricName] || 0).filter(val => val > 0);
    if (values.length === 0) return { min: 0, max: 100 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };
  
  const salesRange = calculateMetricRange('sales');
  const usersRange = calculateMetricRange('users');
  const sessionDurationRange = calculateMetricRange('sessionDuration');
  const bounceRateRange = calculateMetricRange('bounceRate');
  
  // Normalize values
  const normalizeValue = (value, range) => {
    if (value === 0 || value === null || value === undefined) return 0;
    return ((value - range.min) / (range.max - range.min)) * 100;
  };
  
  // Invert bounce rate (lower is better)
  const normalizeBounceRate = (value, range) => {
    if (value === 0 || value === null || value === undefined) return 100;
    return 100 - ((value - range.min) / (range.max - range.min)) * 100;
  };
  
  // Create radar chart data
  const radarData = data.map(item => ({
    month: `Month ${item.month}`,
    sales: normalizeValue(item.sales, salesRange),
    users: normalizeValue(item.users, usersRange),
    sessionDuration: normalizeValue(item.sessionDuration, sessionDurationRange),
    bounceRate: normalizeBounceRate(item.bounceRate, bounceRateRange),
    // Store original values for tooltip
    originalSales: item.sales,
    originalUsers: item.users,
    originalSessionDuration: item.sessionDuration,
    originalBounceRate: item.bounceRate
  })).filter(item => item.sales > 0 || item.users > 0 || item.sessionDuration > 0 || item.bounceRate > 0);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getMonthName = (monthStr) => {
    const monthNumber = parseInt(monthStr.replace('Month ', ''));
    return monthNames[monthNumber - 1];
  };
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded shadow-md border`}>
          <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {getMonthName(data.month)}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sales: ${data.originalSales ? data.originalSales.toLocaleString() : 0}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Users: {data.originalUsers ? data.originalUsers.toLocaleString() : 0}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Session Duration: {data.originalSessionDuration || 0}s
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Bounce Rate: {data.originalBounceRate || 0}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
      <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Monthly KPI Radar - {websiteName}
      </h2>
      
      {radarData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius="80%" data={radarData}>
              <PolarGrid stroke={darkMode ? "#444" : "#ccc"} />
              <PolarAngleAxis 
                dataKey="month" 
                tick={{ fill: darkMode ? '#aaa' : '#888', fontSize: 12 }} 
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Sales"
                dataKey="sales"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.2}
              />
              <Radar
                name="Users"
                dataKey="users"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.2}
              />
              <Radar
                name="Session Duration"
                dataKey="sessionDuration"
                stroke="#ffc658"
                fill="#ffc658"
                fillOpacity={0.2}
              />
              <Radar
                name="Bounce Rate (inverted)"
                dataKey="bounceRate"
                stroke="#ff8042"
                fill="#ff8042"
                fillOpacity={0.2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Not enough data available for the radar chart
        </div>
      )}
      
      <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Note: Values are normalized for comparison. Higher is better for all metrics (bounce rate is inverted).
      </div>
    </div>
  );
};

export default KPIRadarChart;