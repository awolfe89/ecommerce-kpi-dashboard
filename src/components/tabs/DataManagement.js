// src/components/tabs/DataManagement.js
import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import KPIDataForm from '../KPIDataForm';
import KPIDataTable from '../KPIDataTable';
import ShopifyConfig from '../ShopifyConfig';

const DataManagement = ({
  isEditing,
  setIsEditing,
  currentKPI,
  setCurrentKPI,
  handleAddKPI,
  loading,
  combinedData,
  monthNames,
  handleEditKPI,
  handleDeleteKPI,
  websiteName,
  selectedWebsite,
  isShopifyWebsite,
  syncAllShopifyData,
  syncingData
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {websiteName} - Monthly KPI Data
        </h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {isEditing ? 'Cancel' : 'Add/Edit Data'}
        </button>
      </div>
      
      {/* Shopify Integration Section */}
      <ShopifyConfig 
        selectedWebsite={selectedWebsite}
        isShopifyWebsite={isShopifyWebsite}
        syncAllShopifyData={syncAllShopifyData}
        syncingData={syncingData}
      />
      
      {/* Add/Edit Form */}
      {isEditing && (
        <KPIDataForm 
          currentKPI={currentKPI} 
          setCurrentKPI={setCurrentKPI} 
          handleAddKPI={handleAddKPI} 
          monthNames={monthNames} 
          darkMode={darkMode}
        />
      )}
      
      {/* Data Table */}
      <KPIDataTable 
        loading={loading || syncingData} 
        salesComparisonData={combinedData} 
        monthNames={monthNames} 
        handleEditKPI={handleEditKPI} 
        handleDeleteKPI={handleDeleteKPI} 
        darkMode={darkMode}
      />
    </div>
  );
};

export default DataManagement;