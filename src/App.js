import React, { useState, useEffect } from 'react';
import auth from './config/netlifyAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

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