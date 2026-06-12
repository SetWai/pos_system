import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import api from './services/api';
import Products from './pages/Products';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Receipt from './pages/Receipt';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Check if user is logged in and fetch their role (Admin or Cashier)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('/me/');
          setUser(response.data); // data contains { id, username, is_staff }
        } catch (err) {
          console.error("Token invalid or expired", err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/login'; // Force reload to login page
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '20vh' }}>Loading System...</div>;

  // 2. Custom Component to Protect Routes based on Role
  const ProtectedRoute = ({ children, requireAdmin }) => {
    if (!user) {
      return <Navigate to="/login" />; // Not logged in -> Go to Login
    }
    if (requireAdmin && !user.is_staff) {
      return <Navigate to="/checkout" />; // Cashier trying to access Admin page -> Go to Checkout
    }
    return children;
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Navigation Bar */}
        <header style={{ background: '#333', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Supermarket POS</h2>
            
            {/* Dynamic Navbar: Shows links based on User Role */}
            {user && (
              <nav style={{ display: 'flex', gap: '15px' }}>
                {user.is_staff && (
                  <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard (Admin)</Link>
                )}
                
                {/* Both Admin and Cashier can see these */}
                <Link to="/products" style={{ color: '#fff', textDecoration: 'none' }}>Products</Link>
                <Link to="/checkout" style={{ color: '#fff', textDecoration: 'none' }}>POS Terminal</Link>
              </nav>
            )}
          </div>
          
          <div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: '#ccc' }}>
                  User: <strong>{user.username}</strong> ({user.is_staff ? 'Admin' : 'Cashier'})
                </span>
                <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '5px' }}>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 15px', textDecoration: 'none', borderRadius: '5px' }}>
                Login
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flexGrow: 1 }}>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={user ? <Navigate to={user.is_staff ? "/" : "/checkout"} /> : <Login />} />
            
            {/* Admin ONLY Route */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <h2 style={{ padding: '20px' }}>Admin Dashboard</h2>
                  <p style={{ padding: '0 20px' }}>Welcome to the management control panel. Here you will see sales reports, inventory charts, etc.</p>
                </ProtectedRoute>
              } 
            />

            {/* Shared Routes (Admin & Cashier) */}
            <Route 
              path="/products" 
              element={
                <ProtectedRoute requireAdmin={false}>
                  <Products />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute requireAdmin={false}>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/receipt/:id" 
              element={
                <ProtectedRoute requireAdmin={false}>
                  <Receipt />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;