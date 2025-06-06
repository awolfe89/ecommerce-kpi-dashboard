import React, { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const Tooltip = ({ content, children, position = 'top' }) => {
  const { darkMode } = useContext(ThemeContext);
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 rotate-180',
    left: 'left-full top-1/2 transform -translate-y-1/2 -rotate-90',
    right: 'right-full top-1/2 transform -translate-y-1/2 rotate-90'
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]} whitespace-nowrap`}>
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-900'} text-white text-xs rounded py-1 px-2 relative`}>
            {content}
            <div 
              className={`absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${darkMode ? 'border-t-gray-700' : 'border-t-gray-900'} ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;