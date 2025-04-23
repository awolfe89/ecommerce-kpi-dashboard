// netlify/functions/shopify-proxy.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const { 
      endpoint, 
      method = 'GET', 
      shopDomain,
      apiVersion,
      accessToken,
      queryParams = {},
      body = null
    } = data;

    if (!endpoint || !shopDomain || !apiVersion || !accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Missing required parameters'
        })
      };
    }

    // Build the URL with query parameters
    let url = `https://${shopDomain}/admin/api/${apiVersion}/${endpoint}`;
    
    if (Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        params.append(key, value);
      }
      url += `?${params.toString()}`;
    }

    // Make the request to Shopify
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: body ? JSON.stringify(body) : null
    });

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      return {
        statusCode: response.status,
        body: JSON.stringify({
          success: response.ok,
          status: response.status,
          data
        })
      };
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      
      return {
        statusCode: response.status,
        body: JSON.stringify({
          success: false,
          status: response.status,
          message: 'Non-JSON response from Shopify API',
          responseText: text.substring(0, 1000) + (text.length > 1000 ? '...' : '')
        })
      };
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message
      })
    };
  }
};