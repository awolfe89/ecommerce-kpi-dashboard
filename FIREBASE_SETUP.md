# Firebase Setup for Local Development

## Setting up Firebase Service Account

To run the Firebase functions locally, you need to set up a service account:

1. **Get Service Account JSON from Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project (armor-web-kpi)
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the downloaded JSON file

2. **Set Environment Variable for Local Development:**
   
   **Option A: Using .env.local (Recommended for development)**
   ```bash
   # Create .env.local file in project root
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"armor-web-kpi",...}'
   ```
   
   **Option B: Export in terminal**
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"armor-web-kpi",...}'
   ```

3. **For Production (Netlify):**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add `FIREBASE_SERVICE_ACCOUNT_JSON` with the JSON content
   - Deploy your site

## Running Without Firebase (Development Only)

If you want to test the UI without Firebase:

1. The app already bypasses authentication in development mode
2. Firebase calls will fail but won't crash the app
3. You can still test:
   - UI components and layouts
   - Form validation
   - Chart rendering
   - Manual data entry (won't persist)

## Troubleshooting

- **"Service unavailable" error**: Firebase service account not configured
- **"Firebase initialization failed"**: Invalid service account JSON
- **403 errors**: Check Firebase project permissions

For production use, proper Firebase configuration is required.