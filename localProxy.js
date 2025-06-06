const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Import the function handlers
const firebaseProxy = require('./netlify/functions/firebase-proxy');
const shopifyProxy = require('./netlify/functions/shopify-proxy');

// Set up environment variables for functions
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}';

// Handle firebase-proxy
app.post('/.netlify/functions/firebase-proxy', async (req, res) => {
  console.log('Firebase proxy request:', req.body.action);
  const event = {
    httpMethod: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body)
  };
  
  try {
    const response = await firebaseProxy.handler(event, {});
    res.status(response.statusCode).send(response.body);
  } catch (error) {
    console.error('Firebase proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle shopify-proxy
app.post('/.netlify/functions/shopify-proxy', async (req, res) => {
  console.log('Shopify proxy request for:', req.body.websiteId);
  const event = {
    httpMethod: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body)
  };
  
  try {
    const response = await shopifyProxy.handler(event, {});
    res.status(response.statusCode).send(response.body);
  } catch (error) {
    console.error('Shopify proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 9999;
app.listen(PORT, () => {
  console.log(`Local proxy server running on http://localhost:${PORT}`);
  console.log('Proxying functions:');
  console.log('- /.netlify/functions/firebase-proxy');
  console.log('- /.netlify/functions/shopify-proxy');
});