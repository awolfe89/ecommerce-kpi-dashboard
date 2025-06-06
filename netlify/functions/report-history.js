// netlify/functions/report-history.js
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

  // Handle GET requests only
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Skip Identity check when running `netlify dev`
  const isLocal = process.env.NETLIFY_DEV === 'true';
  if (!isLocal) {
    // only in production require a Bearer token
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized - Missing token' })
      };
    }
  }

  try {
    // Extract query parameters
    const { userId, limit = '10', includeProcessing = 'false' } = event.queryStringParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId parameter' })
      };
    }

    // Build query for user's reports
    let query = db.collection('reportRequests')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    // If includeProcessing is false, only get completed reports
    if (includeProcessing === 'false') {
      // Note: We order by createdAt for completed reports too, in case completedAt doesn't exist
      // We'll sort by completedAt in memory after fetching
      query = db.collection('reportRequests')
        .where('userId', '==', userId)
        .where('status', '==', 'completed')
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit) * 2); // Fetch more to account for potential sorting changes
    }

    // Execute the query
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          reports: [],
          message: 'No reports found for this user'
        })
      };
    }

    // Process the reports
    const reports = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const reportInfo = {
        reportId: doc.id,
        type: data.type,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString()
      };

      // Include completion time if available
      if (data.completedAt) {
        reportInfo.completedAt = data.completedAt.toDate().toISOString();
      }

      // Include website info if available
      if (data.data?.website) {
        reportInfo.website = {
          id: data.data.website.id,
          name: data.data.website.name
        };
      }

      // Include time period info if available
      if (data.data?.time) {
        reportInfo.timePeriod = {
          year: data.data.time.year,
          month: data.data.time.month,
          monthName: data.data.time.currentMonthName
        };
      }

      // Only include the full report if it's the most recent completed one
      if (reports.length === 0 && data.status === 'completed' && data.report) {
        reportInfo.report = data.report;
      }

      reports.push(reportInfo);
    });

    // Sort by completedAt if we're filtering by completed reports
    if (includeProcessing === 'false' && reports.length > 0) {
      reports.sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt) : new Date(a.createdAt);
        const dateB = b.completedAt ? new Date(b.completedAt) : new Date(b.createdAt);
        return dateB - dateA; // Most recent first
      });
      // Limit to requested number after sorting
      reports.splice(parseInt(limit));
    }

    // Get the most recent completed report (first in the array if we're filtering by completed)
    const mostRecentCompleted = reports.find(r => r.status === 'completed');

    return {
      statusCode: 200,
      body: JSON.stringify({
        reports,
        mostRecentCompleted: mostRecentCompleted || null,
        hasCompletedReports: reports.some(r => r.status === 'completed'),
        totalCount: reports.length
      })
    };
  } catch (error) {
    console.error('Report history error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};