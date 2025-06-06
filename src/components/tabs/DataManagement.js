// src/components/tabs/DataManagement.js
import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import KPIDataForm from '../KPIDataForm';
import KPIDataTable from '../KPIDataTable';
import ShopifyConfig from '../ShopifyConfig';

import BackgroundReportButton from '../BackgroundReportButton';

const DataManagement = ({
  isEditing,
  setIsEditing,
  currentKPI,
  setCurrentKPI,
  handleAddKPI,
  isSaving,
  loading,
  combinedData,
  monthNames,
  handleEditKPI,
  handleDeleteKPI,
  websiteName,
  selectedWebsite,
  isShopifyWebsite,
  syncAllShopifyData,
  syncingData,
  // Add these new props for report generation
  data,
  prevYearData,
  selectedYear
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {websiteName} - Monthly KPI Data
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {isEditing ? 'Cancel' : 'Add/Edit Data'}
          </button>
          
          {/* Report Generation Button */}
          <BackgroundReportButton
            selectedWebsite={selectedWebsite}
            websiteName={websiteName}
            selectedYear={selectedYear}
            data={data}
            prevYearData={prevYearData}
            requirePassword={true}
          />
        </div>
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
          isSaving={isSaving}
        />
      )}
      
      {/* Data Table */}
      <KPIDataTable 
        loading={loading || syncingData} 
        salesComparisonData={combinedData} 
        monthNames={monthNames} 
        handleEditKPI={handleEditKPI} 
        handleDeleteKPI={handleDeleteKPI}
      />
    </div>
  );
};

export default DataManagement;