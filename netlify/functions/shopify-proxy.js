// netlify/functions/shopify-proxy.js
const fetch = require('node-fetch');
const { rateLimiter } = require('./utils/rateLimiter');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  
  // Rate limiting check
  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rateLimitResult = rateLimiter.check(clientIp);
  
  if (!rateLimitResult.allowed) {
    return {
      statusCode: 429,
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rateLimitResult.retryAfter).toISOString(),
        'Retry-After': Math.ceil(rateLimitResult.retryAfter / 1000)
      },
      body: JSON.stringify({ 
        error: 'Too many requests', 
        message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds.`
      })
    };
  }

  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const { 
      endpoint, 
      method = 'GET',
      websiteId, // Now just getting websiteId, not credentials
      queryParams = {},
      body = null
    } = data;

    if (!endpoint || !websiteId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Missing required parameters'
        })
      };
    }

    // Get credentials from environment vars based on websiteId
    let shopDomain, accessToken, apiVersion = '2023-10';
    
    if (websiteId === 'website3') {
      shopDomain = process.env.SHOPIFY_DOMAIN_2;
      accessToken = process.env.SHOPIFY_API_TOKEN_2;
    } else {
      shopDomain = process.env.SHOPIFY_DOMAIN;
      accessToken = process.env.SHOPIFY_API_TOKEN;
    }

    if (!shopDomain || !accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Server configuration error: Shopify credentials not found'
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