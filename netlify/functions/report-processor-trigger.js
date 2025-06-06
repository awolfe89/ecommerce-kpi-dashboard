// netlify/functions/report-processor-trigger.js
// This function manually triggers the report processor
// It's a wrapper that calls the main processor function

const reportProcessor = require('./report-processor');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Skip authentication check in local development
  const isLocal = process.env.NETLIFY_DEV === 'true';
  if (!isLocal) {
    // Verify authentication in production
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized - Missing token' })
      };
    }
  }

  console.log('Manual trigger received for report processor');

  try {
    // Call the main report processor
    const result = await reportProcessor.handler(event, context);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Report processor triggered successfully',
        processorResult: JSON.parse(result.body)
      })
    };
  } catch (error) {
    console.error('Error triggering report processor:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to trigger report processor',
        details: error.message 
      })
    };
  }
};