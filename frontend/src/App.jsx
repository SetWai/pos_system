import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    // Router wraps the entire application to enable navigation
    <Router>
      <div className="app-container">
        {/* Navigation Bar will be added here later */}
        <header>
          <h2>Supermarket POS System</h2>
        </header>

        {/* Routes define which component to show based on the URL */}
        <main>
          <Routes>
            <Route path="/" element={<h1>Welcome to Dashboard</h1>} />
            <Route path="/checkout" element={<h1>Checkout Page Coming Soon</h1>} />
            <Route path="/products" element={<h1>Products Page Coming Soon</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;