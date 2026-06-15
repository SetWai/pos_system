import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/orders/'),
          api.get('/products/')
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading Dashboard...</div>;

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.final_total), 0);
  const totalOrders = orders.length;
  const lowStockProducts = products.filter(p => p.stock_quantity < 10); // Items with less than 10 stock

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Admin Dashboard</h1>
      
      {/* Top Metric Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#007bff', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Total Revenue</h3>
          <h2>${totalRevenue.toFixed(2)}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: '#28a745', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Total Orders</h3>
          <h2>{totalOrders}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: '#dc3545', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Low Stock Items</h3>
          <h2>{lowStockProducts.length}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left Side: Low Stock Alerts */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', color: '#000', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Inventory Alerts</h3>
          {lowStockProducts.length === 0 ? <p>All stocks are looking good!</p> : (
            <ul style={{ paddingLeft: '20px' }}>
              {lowStockProducts.map(p => (
                <li key={p.id} style={{ marginBottom: '10px' }}>
                  <strong>{p.name}</strong> - Only <span style={{ color: 'red', fontWeight: 'bold' }}>{p.stock_quantity}</span> left
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side: Recent Orders */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', color: '#000', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Recent Sales</h3>
          {orders.length === 0 ? <p>No sales yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {orders.slice(-5).reverse().map(order => ( // Show last 5 orders
                <li key={order.id} style={{ padding: '10px 0', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Order #{order.id}</span>
                  <strong>${order.final_total}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;