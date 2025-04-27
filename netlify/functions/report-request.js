// netlify/functions/report-request.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
let app, db;

function initializeFirebase() {
  if (app) return; // Already initialized

  try {
    // Get Firebase service account credentials from environment variable
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      console.error("Error parsing Firebase service account JSON:", error);
      throw new Error("Invalid Firebase credentials format");
    }

    // Initialize the app with credentials
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    
    // Initialize Firestore
    db = getFirestore();
    
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Ensure Firebase is initialized
  try {
    initializeFirebase();
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Firebase initialization failed: ${error.message}` })
    };
  }

  // Check if POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verify authentication (if needed)
  const token = event.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - Missing token' })
    };
  }

  try {
    // Parse the request body
    const { type, data, userId } = JSON.parse(event.body);
    
    // Validate required fields
    if (!type || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }
    
    // Create a unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Store the report request in Firestore
    const reportRef = db.collection('reportRequests').doc(reportId);
    
    await reportRef.set({
      type,
      data,
      userId: userId || 'anonymous',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      retryCount: 0,
      maxRetries: 3
    });
    
    console.log(`Created report request with ID: ${reportId}`);
    
    // Trigger the background processing (this could be done via a webhook or other mechanism)
    // Here we're just returning the ID, and the actual processing will happen in another function
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        reportId,
        status: 'pending',
        message: 'Report generation has been queued'
      })
    };
  } catch (error) {
    console.error('Report request error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};