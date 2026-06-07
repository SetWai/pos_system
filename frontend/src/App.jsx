import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Products from './pages/Products';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Receipt from './pages/Receipt';

function App() {
  // Check if user is logged in by looking for the token
  const isLoggedIn = !!localStorage.getItem('access_token');

  // Handle Logout by clearing the token and reloading
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
  };

  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff', color: '#000000', minHeight: '100vh' }}>
        <header style={{ background: '#333', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Supermarket POS</h2>
            <nav>
              <Link to="/" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Dashboard</Link>
              <Link to="/products" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Products</Link>
              <Link to="/checkout" style={{ color: 'white', textDecoration: 'none' }}>POS Checkout</Link>
            </nav>
          </div>
          
          {/* Show Login or Logout button based on authentication status */}
          <div>
            {isLoggedIn ? (
              <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '5px' }}>
                Logout
              </button>
            ) : (
              <Link to="/login" style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 15px', textDecoration: 'none', borderRadius: '5px' }}>
                Login
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main>
          <Routes>
            <Route path="/" element={<h2 style={{ padding: '20px' }}>Welcome to Dashboard</h2>} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<Products />} /> 
            <Route path="/checkout" element={isLoggedIn ? <Checkout /> : <Navigate to="/login" />} />
            <Route path="/receipt/:id" element={isLoggedIn ? <Receipt /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;