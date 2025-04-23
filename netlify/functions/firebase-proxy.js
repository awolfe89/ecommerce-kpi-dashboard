// netlify/functions/firebase-proxy.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
// Instead of requiring the file
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

exports.handler = async (event, context) => {
  // Check authentication
  const token = event.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  // Get request details from the body
  const { action, collection, document, data, query } = JSON.parse(event.body);

  try {
    let result;
    // Handle different actions
    switch (action) {
      case 'get':
        if (document) {
          result = await db.collection(collection).doc(document).get();
          return {
            statusCode: 200,
            body: JSON.stringify({ 
              exists: result.exists, 
              data: result.exists ? result.data() : null,
              id: result.id
            })
          };
        } else {
          // Process query params
          let queryRef = db.collection(collection);
          if (query) {
            for (const q of query) {
              queryRef = queryRef.where(q.field, q.operation, q.value);
            }
          }
          
          result = await queryRef.get();
          const docs = [];
          result.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
          });
          
          return {
            statusCode: 200,
            body: JSON.stringify({ docs })
          };
        }

      case 'add':
        result = await db.collection(collection).add(data);
        return {
          statusCode: 200,
          body: JSON.stringify({ id: result.id })
        };

      case 'update':
        await db.collection(collection).doc(document).update(data);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };

      case 'delete':
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
    console.error('Firebase error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};