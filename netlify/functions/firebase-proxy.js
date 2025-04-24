const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Use environment variable for Firebase credentials
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error("Error parsing Firebase service account JSON:", error);
}

// Initialize Firebase Admin with the service account
let app, db;
try {
  app = initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore();
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

exports.handler = async (event, context) => {
  // Check if POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verify authentication
  const token = event.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - Missing token' })
    };
  }

  try {
    // Parse the request body
    const { action, collection, document, data, query } = JSON.parse(event.body);
    
    // Basic validation
    if (!action || !collection) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }
    
    let result;
    
    // Handle different actions
    switch (action) {
      case 'get': 
        if (document) {
          // Get a specific document
          const docRef = await db.collection(collection).doc(document).get();
          return {
            statusCode: 200,
            body: JSON.stringify({
              exists: docRef.exists,
              data: docRef.exists ? docRef.data() : null,
              id: docRef.id
            })
          };
        } else {
          // Query collection
          let queryRef = db.collection(collection);
          
          // Apply query filters if provided
          if (query && Array.isArray(query)) {
            for (const q of query) {
              if (q.field && q.operation && q.value !== undefined) {
                queryRef = queryRef.where(q.field, q.operation, q.value);
              }
            }
          }
          
          // Execute query
          const snapshot = await queryRef.get();
          const docs = [];
          
          snapshot.forEach(doc => {
            docs.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          return {
            statusCode: 200,
            body: JSON.stringify({ docs })
          };
        }
        
      case 'add':
        // Add a new document
        if (!data) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing data for add operation' })
          };
        }
        
        result = await db.collection(collection).add(data);
        return {
          statusCode: 200,
          body: JSON.stringify({ id: result.id })
        };
        
      case 'update':
        // Update a document
        if (!document || !data) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing document ID or data for update operation' })
          };
        }
        
        await db.collection(collection).doc(document).update(data);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
        
      case 'delete':
        // Delete a document
        if (!document) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing document ID for delete operation' })
          };
        }
        
        await db.collection(collection).doc(document).delete();
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
        
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Firebase proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};