// src/components/Modal.js
import React, { useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const Modal = ({ children, title, onClose, size = 'lg' }) => {
  const { darkMode } = useContext(ThemeContext);

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  // Close when clicking outside the modal content
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Determine modal width based on size prop
  const modalSizeClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  }[size] || 'max-w-2xl';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div 
        className={`${modalSizeClass} w-full h-auto max-h-[90vh] ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
          <button 
            onClick={onClose}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} focus:outline-none`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;