// src/components/KPIDataTable.js
import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import ConfirmDialog from './ConfirmDialog';

const KPIDataTable = ({ loading, salesComparisonData, monthNames, handleEditKPI, handleDeleteKPI }) => {
  const { darkMode } = useContext(ThemeContext);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, itemId: null, itemMonth: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(salesComparisonData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = salesComparisonData.slice(startIndex, endIndex);
  
  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [salesComparisonData]);
  
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
            paginatedData.map((item, index) => (
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
                    onClick={() => setDeleteConfirm({ 
                      isOpen: true, 
                      itemId: item.id, 
                      itemMonth: monthNames[item.month - 1] 
                    })}
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
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={`flex justify-between items-center mt-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <div className="text-sm">
            Showing {startIndex + 1} to {Math.min(endIndex, salesComparisonData.length)} of {salesComparisonData.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === 1 
                  ? `cursor-not-allowed opacity-50 ${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`
                  : `hover:bg-blue-600 hover:text-white ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : `hover:bg-blue-600 hover:text-white ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === totalPages 
                  ? `cursor-not-allowed opacity-50 ${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`
                  : `hover:bg-blue-600 hover:text-white ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={() => {
          handleDeleteKPI(deleteConfirm.itemId);
          setDeleteConfirm({ isOpen: false, itemId: null, itemMonth: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, itemId: null, itemMonth: '' })}
        title="Delete KPI Data"
        message={`Are you sure you want to delete the data for ${deleteConfirm.itemMonth}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default KPIDataTable;