export const validateEnv = () => {
  const requiredEnvVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID',

  ];
  
  // Shopify environment variables are only required if using Shopify integration
  const shopifyEnvVars = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_TOKEN',
    'SHOPIFY_DOMAIN'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  // Check if any Shopify environment variables are set
  const hasShopifyEnvVars = shopifyEnvVars.some(env => process.env[env]);
  
  // If any Shopify env vars are set, check that all required ones are present
  if (hasShopifyEnvVars) {
    const missingShopifyVars = shopifyEnvVars.filter(env => !process.env[env]);
    
    if (missingShopifyVars.length > 0) {
      console.warn(`Some Shopify environment variables are missing: ${missingShopifyVars.join(', ')}. Shopify integration may not work correctly.`);
    }
  }
  
  return true;
};