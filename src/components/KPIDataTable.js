// src/components/KPIDataTable.js
import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const KPIDataTable = ({ loading, salesComparisonData, monthNames, handleEditKPI, handleDeleteKPI }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Month</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Sales</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Prev Year Sales</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Diff ($)</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Diff (%)</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Users</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Prev Users</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>User Diff</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Session Duration</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Bounce Rate</th>
            <th className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2 text-left`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="11" className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300'} px-4 py-2 text-center`}>Loading...</td>
            </tr>
          ) : salesComparisonData.length === 0 ? (
            <tr>
              <td colSpan="11" className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300'} px-4 py-2 text-center`}>No data available</td>
            </tr>
          ) : (
            salesComparisonData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 
                ? darkMode ? 'bg-gray-700' : 'bg-gray-50' 
                : darkMode ? 'bg-gray-800' : 'bg-white'
              }>
                <td className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2`}>{monthNames[item.month - 1]}</td>
                <td className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2`}>${item.sales ? item.sales.toLocaleString() : '0'}</td>
                <td className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2`}>${item.prevSales ? item.prevSales.toLocaleString() : '0'}</td>
                <td className={`border ${darkMode ? 'border-gray-600' : 'border-gray-300'} px-4 py-2`} 
                    style={{color: (item.salesDiff || 0) >= 0 
                      ? darkMode ? 'rgb(74, 222, 128)' : 'green' 
                      : darkMode ? 'rgb(248, 113, 113)' : 'red'
                    }}
                >
                  {(item.salesDiff || 0) >= 0 ? '+' : ''}{item.salesDiff ? item.salesDiff.toLocaleString() : '0'}
                </td>
                <td className={`border ${darkMode ? 'border-gray-600' : 'border-gray-300'} px-4 py-2`}
                    style={{color: (item.salesPercent || 0) >= 0 
                      ? darkMode ? 'rgb(74, 222, 128)' : 'green' 
                      : darkMode ? 'rgb(248, 113, 113)' : 'red'
                    }}
                >
                  {(item.salesPercent || 0) >= 0 ? '+' : ''}{item.salesPercent || '0'}%
                </td>
                <td className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2`}>{item.users ? item.users.toLocaleString() : '0'}</td>
                <td className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2`}>{item.prevUsers ? item.prevUsers.toLocaleString() : '0'}</td>
                <td className={`border ${darkMode ? 'border-gray-600' : 'border-gray-300'} px-4 py-2`}
                    style={{color: (item.userDiff || 0) >= 0 
                      ? darkMode ? 'rgb(74, 222, 128)' : 'green' 
                      : darkMode ? 'rgb(248, 113, 113)' : 'red'
                    }}
                >
                  {(item.userDiff || 0) >= 0 ? '+' : ''}{item.userDiff ? item.userDiff.toLocaleString() : '0'}
                </td>
                <td className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2`}>{item.sessionDuration || 0}s</td>
                <td className={`border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300'} px-4 py-2`}>{item.bounceRate || 0}%</td>
                <td className={`border ${darkMode ? 'border-gray-600' : 'border-gray-300'} px-4 py-2`}>
                  <button
                    onClick={() => handleEditKPI(item)}
                    className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} mr-2`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteKPI(item.id)}
                    className={darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default KPIDataTable;