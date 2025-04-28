// src/config/netlifyAuth.js
import netlifyIdentity from 'netlify-identity-widget';

// Create a function to safely initialize after document is ready
const initializeIdentity = () => {
  // Check if we're in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Your Netlify site URL - replace with your actual Netlify site URL
  const siteURL = 'https://ecommercekpidashboard.netlify.app';
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    netlifyIdentity.init({
      container: '#netlify-modal', // This will create the modal if it doesn't exist
      APIUrl: isDevelopment ? `${siteURL}/.netlify/identity` : undefined,
      setCookie: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      netlifyIdentity.init({
        container: '#netlify-modal',
        APIUrl: isDevelopment ? `${siteURL}/.netlify/identity` : undefined,
        setCookie: true
      });
    });
  }

  // Log initialization for debugging
  console.log('Netlify Identity initialized with:', {
    environment: process.env.NODE_ENV,
    apiUrl: isDevelopment ? `${siteURL}/.netlify/identity` : 'default',
    userExists: netlifyIdentity.currentUser() !== null
  });
};

// Initialize safely
initializeIdentity();

export const auth = {
  // Current user state
  currentUser: null,
  
  // Initialize auth
  init() {
    netlifyIdentity.on('login', user => {
      this.currentUser = user;
      netlifyIdentity.close();
    });
    
    netlifyIdentity.on('logout', () => {
      this.currentUser = null;
    });
    
    // Check if user is already logged in
    const user = netlifyIdentity.currentUser();
    if (user) {
      this.currentUser = user;
    }
  },
  
  // Login method
  login() {
    netlifyIdentity.open('login');
    return new Promise((resolve) => {
      netlifyIdentity.on('login', user => {
        resolve(user);
      });
    });
  },
  
  // Logout method
  logout() {
    netlifyIdentity.logout();
  },
  
  // Get current user
  getCurrentUser() {
    return netlifyIdentity.currentUser();
  },
  
  // Get auth token for API calls
  async getAuthToken() {
    const user = netlifyIdentity.currentUser();
    if (!user) {
      throw new Error('No user logged in');
    }
    
    return user.token.access_token;
  }
};

// Initialize auth on import
auth.init();

export default auth;