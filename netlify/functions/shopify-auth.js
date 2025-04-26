// netlify/functions/shopify-auth.js
exports.handler = async (event) => {
    // Only return what's needed for client initialization
    // Actual API tokens should only be used in other server-side functions
    const shopifyConfig = {
      domains: {
        primary: process.env.SHOPIFY_DOMAIN,
        secondary: process.env.SHOPIFY_DOMAIN_2
        
      },
      // Include API version but NOT tokens
      apiVersion: '2023-10'
    };
  
    return {
      statusCode: 200,
      body: JSON.stringify({ shopifyConfig })
    };
  };