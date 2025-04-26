// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Start with null configuration
let app = null;
let db = null;

// Function to initialize Firebase
export const initializeFirebase = async () => {
  if (app) return { app, db }; // Return existing instance if already initialized
  
  try {
    // Fetch configuration from Netlify Function
    const response = await fetch('/.netlify/functions/firebase-config');
    const data = await response.json();
    
    if (!data.firebaseConfig) {
      throw new Error('Failed to fetch Firebase configuration');
    }
    
    // Initialize Firebase with fetched config
    app = initializeApp(data.firebaseConfig);
    db = getFirestore(app);
    
    return { app, db };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
};

// Export initialized instances or initialization function
export { app, db, initializeFirebase };