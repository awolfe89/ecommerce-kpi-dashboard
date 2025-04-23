# eCommerce KPI Dashboard

A React dashboard for tracking KPIs across multiple websites, including Shopify integration.

## Setup

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and add your API credentials
4. Start the proxy server: `node server.js`
5. Start the React app: `npm start`

## Shopify Integration

This dashboard supports multiple Shopify websites. For each Shopify site:

1. Create a custom app in your Shopify admin
2. Set required permissions (read_orders, read_customers, etc.)
3. Add the API key and access token to your .env file
