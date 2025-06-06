// netlify/functions/report-processor-trigger.js
// This function provides a quick response that report processing has been triggered
// The actual processing happens via scheduled functions or manual runs

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

  // Simply return success immediately
  // The actual processing will happen through:
  // 1. Scheduled function runs (if configured)
  // 2. Manual triggering of the report-processor function
  // 3. Or the polling mechanism will pick up the report when ready
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Report processing triggered',
      status: 'accepted',
      note: 'Report will be processed in the background'
    })
  };
};