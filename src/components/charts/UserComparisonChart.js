import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UserComparisonChart = ({ userChartData, selectedYear, colors }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">User Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={userChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="currentUsers" 
            name={`${selectedYear} Users`} 
            stroke={colors.tertiary} 
            activeDot={{ r: 8 }} 
          />
          <Line 
            type="monotone" 
            dataKey="previousUsers" 
            name={`${selectedYear - 1} Users`} 
            stroke={colors.quaternary} 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserComparisonChart;