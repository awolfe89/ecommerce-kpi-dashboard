// src/components/Login.js
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import auth from '../config/netlifyAuth';

const Login = ({ onLogin }) => {
  const { darkMode } = useContext(ThemeContext);
  // Remove unused state variables
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      onLogin();
    }
  }, [onLogin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Netlify Identity doesn't use email/password directly in code
      // We'll use the Netlify Identity widget instead
      await auth.login();
      onLogin();
    } catch (error) {
      console.error("Netlify auth error:", error);
      setError('Authentication failed: ' + error.message);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg`}>
        <h2 className={`mb-6 text-center text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>eCommerce KPI Dashboard</h2>
        <form onSubmit={handleLogin}>
          {error && <p className={`mb-4 rounded p-2 ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>{error}</p>}
          
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none"
          >
            Sign In with Netlify Identity
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;