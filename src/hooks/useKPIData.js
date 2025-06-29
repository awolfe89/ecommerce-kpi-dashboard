import { useState, useEffect, useCallback, useRef } from 'react';
import firebaseProxy from '../services/firebaseProxy';
import shopifyService from '../services/shopifyService';

// This is the list of websites that use Shopify
const shopifyWebsites = ['website2', 'website3']; // Add more IDs as needed

const useKPIData = (selectedYear, selectedWebsite) => {
  const [data, setData] = useState([]);
  const [prevYearData, setPrevYearData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingData, setSyncingData] = useState(false);
  const [currentKPI, setCurrentKPI] = useState({
    year: selectedYear,
    month: 1,
    sales: 0,
    users: 0,
    sessionDuration: 0,
    bounceRate: 0,
    website: selectedWebsite,
    id: null
  });
  
  // Use ref to track the latest fetch request
  const fetchRequestId = useRef(0);

  // Check if the selected website is a Shopify site
  const isShopifyWebsite = shopifyWebsites.includes(selectedWebsite);
  
  const fetchData = useCallback(async () => {
    // Increment request ID to track this specific request
    const currentRequestId = ++fetchRequestId.current;
    
    setLoading(true);
    try {
      // Run both queries in parallel
      const [currentYearResult, prevYearResult] = await Promise.all([
        firebaseProxy.getDocuments('kpiData', [
          { field: 'website', operation: '==', value: selectedWebsite },
          { field: 'year', operation: '==', value: selectedYear }
        ]),
        firebaseProxy.getDocuments('kpiData', [
          { field: 'website', operation: '==', value: selectedWebsite },
          { field: 'year', operation: '==', value: selectedYear - 1 }
        ])
      ]);
      
      // Check if this is still the latest request
      if (currentRequestId !== fetchRequestId.current) {
        return; // Abandon this request as a newer one has started
      }
      
      // Process results
      const currentYearData = currentYearResult.docs || [];
      const previousYearData = prevYearResult.docs || [];
      
      // Sort data by month
      currentYearData.sort((a, b) => a.month - b.month);
      previousYearData.sort((a, b) => a.month - b.month);
      
      setData(currentYearData);
      setPrevYearData(previousYearData);
    } catch (error) {
      // Only show error if this is still the latest request
      if (currentRequestId === fetchRequestId.current) {
        console.error("Error fetching data: ", error);
        alert(`Unable to load KPI data. ${error.message || 'Please check your connection and try again.'}`);
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, [selectedYear, selectedWebsite]);

  useEffect(() => {
    fetchData();
    setCurrentKPI(prev => ({
      ...prev,
      year: selectedYear,
      website: selectedWebsite
    }));
  }, [selectedYear, selectedWebsite, fetchData]);

  const handleAddKPI = async (kpiData) => {
    try {
      // Ensure website field is included
      const dataWithWebsite = {
        ...kpiData,
        website: selectedWebsite
      };
      
      if (kpiData.id) {
        await firebaseProxy.updateDocument('kpiData', kpiData.id, dataWithWebsite);
      } else {
        // Check if data for this month, year, and website already exists
        const existingEntry = data.find(item => item.month === kpiData.month);
        
        if (existingEntry) {
          await firebaseProxy.updateDocument('kpiData', existingEntry.id, dataWithWebsite);
        } else {
          await firebaseProxy.addDocument('kpiData', dataWithWebsite);
        }
      }
      
      // Refresh data
      fetchData();
      return true;
    } catch (error) {
      console.error("Error adding/updating data: ", error);
      alert(`Unable to save KPI data. ${error.message || 'Please try again.'}`);
      return false;
    }
  };

  const handleDeleteKPI = async (id) => {
    try {
      await firebaseProxy.deleteDocument('kpiData', id);
      fetchData();
      return true;
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert(`Unable to delete KPI data. ${error.message || 'Please try again.'}`);
      return false;
    }
  };
  
  // Function to sync data from Shopify for a specific month
  const syncShopifyDataForMonth = async (year, month, websiteId = selectedWebsite) => {
    try {
      // Fetch data from Shopify
      const shopifyData = await shopifyService.getMonthlyKPIData(year, month, websiteId);
      
      // Format data for our database
      const kpiData = {
        year,
        month,
        sales: shopifyData.sales,
        users: shopifyData.users,
        sessionDuration: shopifyData.sessionDuration,
        bounceRate: shopifyData.bounceRate,
        website: websiteId,
        lastSyncedAt: new Date().toISOString()
      };
      
      // Check if we already have data for this month and website
      const existingEntry = data.find(item => item.month === month && item.website === websiteId);
      
      if (existingEntry) {
        // Update existing record
        await firebaseProxy.updateDocument('kpiData', existingEntry.id, kpiData);
      } else {
        // Create new record
        await firebaseProxy.addDocument('kpiData', kpiData);
      }
      
      return true;
    } catch (error) {
      console.error(`Error syncing Shopify data for ${year}-${month}:`, error);
      return false;
    }
  };
  
  // Function to sync all data from Shopify for the selected year
  const syncAllShopifyData = async (websiteId = selectedWebsite) => {
    if (!isShopifyWebsite) return false;
    
    setSyncingData(true);
    try {
      const currentDate = new Date();
      const maxMonth = selectedYear === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 12;
      
      // Sync each month
      for (let month = 1; month <= maxMonth; month++) {
        await syncShopifyDataForMonth(selectedYear, month, websiteId);
      }
      
      // Refresh data after sync
      fetchData();
      return true;
    } catch (error) {
      console.error("Error syncing all Shopify data:", error);
      return false;
    } finally {
      setSyncingData(false);
    }
  };
  
  // Function to test the Shopify connection
  const testShopifyConnection = async () => {
    if (!isShopifyWebsite) return false;
    
    try {
      return await shopifyService.testConnection();
    } catch (error) {
      console.error("Error testing Shopify connection:", error);
      return false;
    }
  };
  
  return {
    data,
    prevYearData,
    loading,
    syncingData,
    currentKPI,
    setCurrentKPI,
    handleAddKPI,
    handleDeleteKPI,
    fetchData,
    isShopifyWebsite,
    syncShopifyDataForMonth,
    syncAllShopifyData,
    testShopifyConnection
  };
};

export default useKPIData;