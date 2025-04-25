// src/components/ShopifyConfig.js
import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import shopifyService from '../services/shopifyService';

const ShopifyConfig = ({ selectedWebsite, isShopifyWebsite, syncAllShopifyData, syncingData }) => {
  const { darkMode } = useContext(ThemeContext);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [testing, setTesting] = useState(false);
  
  // Get the domain for the selected website
  const shopDomain = selectedWebsite === 'website2' 
    ? process.env.SHOPIFY_DOMAIN 
    : process.env.SHOPIFY_DOMAIN_2;
  
  // Check connection status when component mounts or website changes
  useEffect(() => {
    if (isShopifyWebsite) {
      testConnection();
    }
  }, [isShopifyWebsite, selectedWebsite]);
  
  const testConnection = async () => {
    if (!isShopifyWebsite) return;
    
    setTesting(true);
    try {
      const connected = await shopifyService.testConnection(selectedWebsite);
      setConnectionStatus(connected ? 'connected' : 'failed');
    } catch (error) {
      console.error('Error testing Shopify connection:', error);
      setConnectionStatus('failed');
    } finally {
      setTesting(false);
    }
  };
  
  // If this is not a Shopify website, don't render anything
  if (!isShopifyWebsite) {
    return null;
  }
  
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Shopify Integration - {shopDomain}
      </h2>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className={`mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Connection Status:</span>
          {testing ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800`}>
              Testing...
            </span>
          ) : connectionStatus === 'connected' ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
              Connected
            </span>
          ) : connectionStatus === 'failed' ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800`}>
              Connection Failed
            </span>
          ) : (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
              Unknown
            </span>
          )}
        </div>
        
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Shopify integration allows you to automatically fetch sales and analytics data from your Shopify store.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={testConnection}
          disabled={testing}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            darkMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          Test Connection
        </button>
        
        <button
          onClick={() => syncAllShopifyData(selectedWebsite)}
          disabled={connectionStatus !== 'connected' || syncingData}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            darkMode 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-50`}
        >
          {syncingData ? 'Syncing...' : 'Sync Data from Shopify'}
        </button>
      </div>
    </div>
  );
};

export default ShopifyConfig;