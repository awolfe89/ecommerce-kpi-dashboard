// netlify/functions/report-status.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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

  // Handle both GET and POST requests
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
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
    let reportId;
    
    // Extract the report ID from either query parameters (GET) or request body (POST)
    if (event.httpMethod === 'GET') {
      reportId = event.queryStringParameters?.reportId;
    } else {
      const body = JSON.parse(event.body);
      reportId = body.reportId;
    }
    
    // Validate report ID
    if (!reportId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing report ID' })
      };
    }
    
    // Fetch the report status from Firestore
    const reportRef = db.collection('reportRequests').doc(reportId);
    const reportDoc = await reportRef.get();
    
    if (!reportDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found' })
      };
    }
    
    // Get report data
    const reportData = reportDoc.data();
    
    // Prepare response based on status
    const response = {
      reportId,
      status: reportData.status,
      createdAt: reportData.createdAt?.toDate().toISOString(),
      updatedAt: reportData.updatedAt?.toDate().toISOString()
    };
    
    // Include the report if it's completed
    if (reportData.status === 'completed' && reportData.report) {
      response.report = reportData.report;
      response.completedAt = reportData.completedAt?.toDate().toISOString();
    }
    
    // Include error info if failed
    if (reportData.status === 'failed') {
      response.error = reportData.error;
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Report status error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};