import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesComparisonChart = ({ chartData, selectedYear, colors }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Sales Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="currentSales" name={`${selectedYear} Sales`} fill={colors.primary} />
          <Bar dataKey="previousSales" name={`${selectedYear - 1} Sales`} fill={colors.secondary} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesComparisonChart;