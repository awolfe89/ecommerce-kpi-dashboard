import React, { useState, useEffect } from 'react';
import auth from './config/netlifyAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import netlifyIdentity from 'netlify-identity-widget';


const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check authentication state when the app loads
  useEffect(() => {
    const user = auth.getCurrentUser();
    setIsLoggedIn(!!user);
    setLoading(false);
    
    // Setup listeners for login/logout
    const onLogin = () => setIsLoggedIn(true);
    const onLogout = () => setIsLoggedIn(false);
    
    // Add event listeners
    document.addEventListener('netlify-identity-login', onLogin);
    document.addEventListener('netlify-identity-logout', onLogout);
    
    // Clean up
    return () => {
      document.removeEventListener('netlify-identity-login', onLogin);
      document.removeEventListener('netlify-identity-logout', onLogout);
    };
  }, []);
  useEffect(() => {
    console.log("Netlify Identity Status:", {
      initialized: netlifyIdentity && typeof netlifyIdentity.open === 'function',
      currentUser: netlifyIdentity.currentUser(),
      APIUrl: netlifyIdentity.store && netlifyIdentity.store.user && netlifyIdentity.store.user.api && netlifyIdentity.store.user.api.apiURL
    });
  }, []);
  
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    auth.logout();
    setIsLoggedIn(false);
  };
  
  // Show loading state
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <div>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;