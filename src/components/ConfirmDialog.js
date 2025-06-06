import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const ConfirmDialog = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700"
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {message}
        </p>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${confirmButtonClass} transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;