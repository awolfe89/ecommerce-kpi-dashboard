// src/components/ShopifyTestComponent.js
import React, { useState } from 'react';
import shopifyService from '../services/shopifyService';

const ShopifyTestComponent = ({ selectedWebsite }) => {
  const [testStatus, setTestStatus] = useState('pending');
  const [testResult, setTestResult] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [lastMonth, setLastMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() || 12 // 0 is January, if 0, set to December of previous year
  });

  // Test the shop.json endpoint
  const testShopEndpoint = async () => {
    setTestStatus('testing');
    try {
      // Use the shopifyService to test connection
      const isConnected = await shopifyService.testConnection(selectedWebsite);
      
      if (isConnected) {
        // If connection successful, fetch shop data directly
        const shopData = await shopifyService.makeProxyRequest('shop.json', { 
          websiteId: selectedWebsite 
        });
        setTestStatus('success');
        setShopInfo(shopData.shop);
      } else {
        setTestStatus('failed');
        setTestResult({ message: 'Connection test failed' });
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestStatus('error');
      setTestResult(error.message);
    }
  };

  // Test orders endpoint for a specific month
  const testOrdersEndpoint = async () => {
    setTestStatus('testing');
    try {
      const { year, month } = lastMonth;
      
      // Use shopifyService to fetch sales data
      const salesData = await shopifyService.getMonthlySales(year, month, selectedWebsite);
      
      console.log(`Orders for ${year}-${month} test result:`, salesData);
      
      setTestStatus('success');
      setTestResult({
        orderCount: salesData.orderCount,
        totalSales: salesData.sales,
        message: `Found ${salesData.orderCount} orders with total sales of $${salesData.sales.toFixed(2)}`
      });
    } catch (error) {
      console.error('Test error:', error);
      setTestStatus('error');
      setTestResult(error.message);
    }
  };

  // Test the whole KPI data fetching process
  const testKPIFetch = async () => {
    setTestStatus('testing');
    try {
      const { year, month } = lastMonth;
      const kpiData = await shopifyService.getMonthlyKPIData(year, month, selectedWebsite);
      console.log(`KPI data for ${year}-${month}:`, kpiData);
      
      setTestStatus('success');
      setTestResult(kpiData);
    } catch (error) {
      console.error('KPI test error:', error);
      setTestStatus('error');
      setTestResult(error.message);
    }
  };

  const handleMonthChange = (e) => {
    setLastMonth({
      ...lastMonth,
      month: parseInt(e.target.value, 10)
    });
  };

  const handleYearChange = (e) => {
    setLastMonth({
      ...lastMonth,
      year: parseInt(e.target.value, 10)
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow my-4">
      <h2 className="text-xl font-semibold mb-4">Shopify API Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            type="number"
            value={lastMonth.year}
            onChange={handleYearChange}
            className={`w-full rounded-md border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Month (1-12)</label>
          <input
            type="number"
            min="1"
            max="12"
            value={lastMonth.month}
            onChange={handleMonthChange}
            className={`w-full rounded-md border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testShopEndpoint}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Test Shop Info
        </button>
        
        <button
          onClick={testOrdersEndpoint}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Test Orders
        </button>
        
        <button
          onClick={testKPIFetch}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Test Full KPI Fetch
        </button>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-medium mb-1">Status:</div>
        <div className={`text-${testStatus === 'success' ? 'green' : (testStatus === 'error' || testStatus === 'failed' ? 'red' : 'blue')}-600 font-medium`}>
          {testStatus === 'pending' ? 'Not tested yet' : 
           testStatus === 'testing' ? 'Testing...' : 
           testStatus === 'success' ? 'Success!' : 
           testStatus === 'failed' ? 'API call failed' : 
           'Error encountered'}
        </div>
      </div>
      
      {shopInfo && (
        <div className="mb-4">
          <div className="text-sm font-medium mb-1">Shop Info:</div>
          <div className="bg-gray-100 p-3 rounded text-xs overflow-auto">
            <pre>{JSON.stringify(shopInfo, null, 2)}</pre>
          </div>
        </div>
      )}
      
      {testResult && (
        <div>
          <div className="text-sm font-medium mb-1">Result:</div>
          <div className="bg-gray-100 p-3 rounded text-xs overflow-auto">
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyTestComponent;