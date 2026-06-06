import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Products from './pages/Products';
import Checkout from './pages/Checkout';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff', color: '#000000', minHeight: '100vh' }}>
        {/* Navigation Bar */}
        <header style={{ background: '#333', color: 'white', padding: '10px 20px', display: 'flex', gap: '20px' }}>
          <h2 style={{ margin: 0 }}>POS System</h2>
          <nav style={{ alignSelf: 'center' }}>
            <Link to="/" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/products" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Products</Link>
            <Link to="/checkout" style={{ color: 'white', textDecoration: 'none' }}>Checkout</Link>
          </nav>
        </header>

        {/* Page Content */}
        <main>
          <Routes>
            <Route path="/" element={<h2 style={{ padding: '20px' }}>Welcome to Dashboard</h2>} />
            <Route path="/products" element={<Products />} /> 
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;