import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import DashboardLayout from './layout/DashboardLayout';
import WebsiteSelector from './WebsiteSelector';
import MonthlyDashboard from './tabs/MonthlyDashboard';
import MultiYearAnalysis from './tabs/MultiYearAnalysis';
import DataManagement from './tabs/DataManagement';
import ShopifyTestComponent from './ShopifyTestComponent'; // Import the test component
import useKPIData from '../hooks/useKPIData';
import { calculateAverageMonthSales, forecastYearlySales, prepareChartData } from '../utils/dataCalculations';

// Constants
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const colors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  tertiary: '#f59e0b',
  quaternary: '#ef4444',
  quinary: '#8b5cf6',
};

// Website configurations
const websites = [
  { id: 'website1', name: 'Armor Animal Health' },
  { id: 'website2', name: 'GrubsBootsUSA', isShopify: true },
  { id: 'website3', name: 'PrimePet&VetSupply', isShopify: true }
];

const Dashboard = ({ onLogout }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState('monthly');
  
  // Year selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Website selection state
  const [selectedWebsite, setSelectedWebsite] = useState(websites[0].id);
  
  // Form editing state
  const [isEditing, setIsEditing] = useState(false);
  
  // Use KPI data hook for data management
  const {
    data,
    prevYearData,
    loading,
    syncingData,
    currentKPI,
    setCurrentKPI,
    handleAddKPI,
    handleDeleteKPI,
    isShopifyWebsite,
    syncAllShopifyData
  } = useKPIData(selectedYear, selectedWebsite);
  
  // Generate years for dropdown
  const generateYearsArray = () => {
    const years = [];
    const startYear = 2021;
    const currentYear = new Date().getFullYear();
    const endYear = currentYear + 1;
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };
  const years = generateYearsArray();
  
  // Prepare chart data
  const {
    chartData,
    userChartData,
    sessionDurationData,
    bounceRateData,
    combinedData
  } = prepareChartData(data, prevYearData, monthNames);
  
  // Handle saving KPI data
  const saveKPI = async () => {
    // Prepare the data object
    const kpiData = {
      year: selectedYear,
      month: currentKPI.month,
      sales: Number(currentKPI.sales || 0),
      users: Number(currentKPI.users || 0), 
      sessionDuration: Number(currentKPI.sessionDuration || 0),
      bounceRate: Number(currentKPI.bounceRate || 0),
      website: selectedWebsite
    };
    
    // Add ID if we're editing an existing record
    if (currentKPI.id) {
      kpiData.id = currentKPI.id;
    }
    
    // Save the data
    const success = await handleAddKPI(kpiData);
    
    if (success) {
      // Reset form
      setCurrentKPI({
        year: selectedYear,
        month: 1,
        sales: 0,
        users: 0,
        sessionDuration: 0,
        bounceRate: 0,
        website: selectedWebsite,
        id: null
      });
      setIsEditing(false);
    }
  };
  
  // Handle record editing
  const editKPI = (kpi) => {
    setCurrentKPI({
      year: kpi.year,
      month: kpi.month,
      sales: kpi.sales,
      users: kpi.users,
      sessionDuration: kpi.sessionDuration,
      bounceRate: kpi.bounceRate,
      website: kpi.website,
      id: kpi.id
    });
    setIsEditing(true);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      auth.logout();
      onLogout();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedYear={selectedYear}
      years={years}
      setSelectedYear={setSelectedYear}
      onLogout={handleLogout}
      extra={
        <WebsiteSelector
          selectedWebsite={selectedWebsite}
          setSelectedWebsite={setSelectedWebsite}
          websites={websites}
        />
      }
    >
      {activeTab === 'monthly' && (
        <MonthlyDashboard 
          data={data}
          chartData={chartData}
          userChartData={userChartData}
          sessionDurationData={sessionDurationData}
          bounceRateData={bounceRateData}
          calculateAverageMonthSales={() => calculateAverageMonthSales(data)}
          forecastYearlySales={() => forecastYearlySales(data)}
          selectedYear={selectedYear}
          selectedWebsite={selectedWebsite}
          websiteName={websites.find(w => w.id === selectedWebsite)?.name}
          colors={colors}
        />
      )}
      
      {activeTab === 'yearly' && (
        <MultiYearAnalysis 
          selectedWebsite={selectedWebsite}
          websiteName={websites.find(w => w.id === selectedWebsite)?.name}
        />
      )}
      
      {activeTab === 'data' && (
        <>
          {/* Add the ShopifyTestComponent when on data tab and using Shopify website */}
          {isShopifyWebsite && (
            <ShopifyTestComponent />
          )}
          
          <DataManagement
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            currentKPI={currentKPI}
            setCurrentKPI={setCurrentKPI}
            handleAddKPI={saveKPI}
            loading={loading}
            syncingData={syncingData}
            combinedData={combinedData}
            monthNames={monthNames}
            handleEditKPI={editKPI}
            handleDeleteKPI={handleDeleteKPI}
            selectedWebsite={selectedWebsite}
            websiteName={websites.find(w => w.id === selectedWebsite)?.name}
            isShopifyWebsite={isShopifyWebsite}
            syncAllShopifyData={syncAllShopifyData}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;