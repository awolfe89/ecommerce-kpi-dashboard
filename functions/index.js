const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Enable CORS with credentials
app.use(cors({ origin: true, credentials: true }));

// Parse JSON request bodies
app.use(express.json());

// Middleware to verify Firebase Auth token
const validateFirebaseAuth = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - No token provided' 
      });
    }
    
    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach the user to the request
    req.user = decodedToken;
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized - Invalid token' 
    });
  }
};

// Shopify API proxy endpoint with authentication
app.post('/shopify', validateFirebaseAuth, async (req, res) => {
  try {
    // Get Shopify configuration from Firebase config
    const shopifyConfig = functions.config().shopify || {};
    
    const { 
      endpoint, 
      method = 'GET', 
      websiteId,
      queryParams = {},
      body = null
    } = req.body;
    
    // Determine which credentials to use based on websiteId
    let shopDomain, accessToken;
    
    if (websiteId === 'website3') {
      shopDomain = shopifyConfig.domain_2 || process.env.SHOPIFY_DOMAIN_2;
      accessToken = shopifyConfig.api_token_2 || process.env.SHOPIFY_API_TOKEN_2;
    } else {
      // Default to website2 (GrubsBootsUSA)
      shopDomain = shopifyConfig.domain || process.env.SHOPIFY_DOMAIN;
      accessToken = shopifyConfig.api_token || process.env.SHOPIFY_API_TOKEN;
    }
    
    const apiVersion = '2023-10'; // You could also make this configurable
    
    // Validate required parameters
    if (!endpoint || !shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        missingParams: [
          !endpoint ? 'endpoint' : null,
          !shopDomain ? 'shopDomain' : null,
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

    console.log(`Making request to Shopify API: ${url}`);

    // Make the request to Shopify
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: body ? JSON.stringify(body) : null
    });

    // Get response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    // Return the data
    return res.json({
      success: response.ok,
      status: response.status,
      data
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Health check endpoint - no auth required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// Create a user function for initial setup (only call this once)
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  try {
    // Only allow this function to be called by other Firebase Admin SDK services or authenticated users
    if (!context.auth && !context.app) {
      throw new Error('Unauthorized');
    }
    
    const { email, password } = data;
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Create the user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true
    });
    
    // Set custom claims to mark as admin
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true
    });
    
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});