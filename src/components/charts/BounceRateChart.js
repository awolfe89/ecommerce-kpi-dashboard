import React, { memo, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../context/ThemeContext';

const BounceRateChart = memo(({ bounceRateData, colors }) => {
  const { darkMode } = useContext(ThemeContext);
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bounce Rate (%)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={bounceRateData}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
          <Tooltip 
            formatter={(value) => `${Number(value).toFixed(1)}%`}
            contentStyle={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              borderColor: darkMode ? '#374151' : '#e5e7eb',
              color: darkMode ? '#f3f4f6' : '#111827'
            }}
          />
          <Legend wrapperStyle={{ color: darkMode ? '#f3f4f6' : '#111827' }} />
          <Line 
            type="monotone" 
            dataKey="bounceRate" 
            stroke={colors.quaternary} 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

BounceRateChart.displayName = 'BounceRateChart';

export default BounceRateChart;