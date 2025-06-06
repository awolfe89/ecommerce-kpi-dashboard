import React, { memo, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../context/ThemeContext';

const SalesComparisonChart = memo(({ chartData, selectedYear, colors }) => {
  const { darkMode } = useContext(ThemeContext);
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sales Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
          <Tooltip 
            formatter={(value) => `$${Number(value).toLocaleString()}`}
            contentStyle={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              borderColor: darkMode ? '#374151' : '#e5e7eb',
              color: darkMode ? '#f3f4f6' : '#111827'
            }}
          />
          <Legend wrapperStyle={{ color: darkMode ? '#f3f4f6' : '#111827' }} />
          <Bar dataKey="currentSales" name={`${selectedYear} Sales`} fill={colors.primary} />
          <Bar dataKey="previousSales" name={`${selectedYear - 1} Sales`} fill={colors.secondary} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

SalesComparisonChart.displayName = 'SalesComparisonChart';

export default SalesComparisonChart;