// src/config/netlifyAuth.js
import netlifyIdentity from 'netlify-identity-widget';

// Initialize Netlify Identity
netlifyIdentity.init({
  container: '#netlify-modal', // defaults to body
  locale: 'en' // defaults to 'en'
});

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