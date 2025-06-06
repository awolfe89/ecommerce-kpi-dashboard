// server.js with enhanced debugging
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 4000;

// Simple rate limiter
const requestCounts = new Map();
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, firstRequest: now });
    return next();
  }
  
  const userData = requestCounts.get(ip);
  
  if (now - userData.firstRequest > windowMs) {
    userData.count = 1;
    userData.firstRequest = now;
    return next();
  }
  
  if (userData.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((userData.firstRequest + windowMs - now) / 1000)
    });
  }
  
  userData.count++;
  next();
};

// Configure CORS with proper security
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from localhost ports (development)
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/
    ];
    
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Access-Token'],
  maxAge: 86400 // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Apply rate limiting
app.use(rateLimiter);

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Shopify API proxy endpoint
app.post('/api/shopify', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('Received proxy request:', {
      endpoint: req.body.endpoint,
      method: req.body.method,
      shopDomain: req.body.shopDomain,
      apiVersion: req.body.apiVersion,
      queryParams: req.body.queryParams
    });
    
    const { 
      endpoint, 
      method = 'GET', 
      shopDomain,
      apiVersion,
      accessToken,
      queryParams = {},
      body = null
    } = req.body;

    if (!endpoint || !shopDomain || !apiVersion || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        missingParams: [
          !endpoint ? 'endpoint' : null,
          !shopDomain ? 'shopDomain' : null,
          !apiVersion ? 'apiVersion' : null,
          !accessToken ? 'accessToken' : null
        ].filter(Boolean)
      });
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

    console.log(`[${startTime}] Making request to Shopify API:`, url);
    console.log(`[${startTime}] Headers:`, {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken ? `${accessToken.substr(0, 4)}...` : 'undefined'
    });

    try {
      // Make the request to Shopify
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: body ? JSON.stringify(body) : null
      });

      const responseHeaders = {};
      response.headers.forEach((value, name) => {
        responseHeaders[name] = value;
      });

      console.log(`[${startTime}] Shopify API response status:`, response.status);
      console.log(`[${startTime}] Shopify API response headers:`, responseHeaders);

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const endTime = Date.now();
        console.log(`[${startTime}] Shopify API call completed in ${endTime - startTime}ms`);
        
        // Return the data
        return res.json({
          success: response.ok,
          status: response.status,
          data
        });
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error(`[${startTime}] Non-JSON response:`, text.substring(0, 500) + (text.length > 500 ? '...' : ''));
        
        return res.status(response.status).json({
          success: false,
          status: response.status,
          message: 'Non-JSON response from Shopify API',
          responseText: text.substring(0, 1000) + (text.length > 1000 ? '...' : '')
        });
      }
    } catch (fetchError) {
      console.error(`[${startTime}] Fetch error:`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// Test endpoint to verify the server is running
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Proxy server is running',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});