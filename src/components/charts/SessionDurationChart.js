import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SessionDurationChart = ({ sessionDurationData, colors }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Session Duration (seconds)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sessionDurationData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="sessionDuration" 
            stroke={colors.quinary} 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SessionDurationChart;