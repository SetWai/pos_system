import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Checkout = () => {
  // State for storing available products from the database
  const [products, setProducts] = useState([]);
  
  // State for the shopping cart (items the customer is buying)
  const [cart, setCart] = useState([]);
  
  // State for payment method
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Fetch products when the page loads
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/');
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Function to handle adding a product to the cart
  const addToCart = (product) => {
    // Check if the product is already in the cart
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // If it exists, just increase the quantity
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, item_subtotal: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      // If it's a new item, add it to the cart array
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        unit_price: parseFloat(product.price),
        quantity: 1,
        item_subtotal: parseFloat(product.price)
      }]);
    }
  };

  // Function to remove an item or decrease its quantity
  const removeFromCart = (productId) => {
    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem.quantity === 1) {
      // Remove completely if quantity is 1
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      // Decrease quantity by 1
      setCart(cart.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: item.quantity - 1, item_subtotal: (item.quantity - 1) * item.unit_price }
          : item
      ));
    }
  };

  // Calculate Totals (Subtotal, Tax, Final Total)
  const subtotal = cart.reduce((sum, item) => sum + item.item_subtotal, 0);
  const taxRate = 0.05; // 5% Commercial Tax
  const taxAmount = subtotal * taxRate;
  const finalTotal = subtotal + taxAmount;

  // Function to send the order to Django Backend
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    // Format the data to match our Django 'create_order' function requirements
    const orderData = {
      cashier: 1, // Hardcoded for now (User ID 1). Later we can use logged-in user.
      customer: null, // Optional
      payment_method: paymentMethod,
      subtotal: subtotal.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      discount_amount: 0, // Hardcoded to 0 for now
      final_total: finalTotal.toFixed(2),
      items: cart // The cart state perfectly matches the items array format
    };

    try {
      const response = await api.post('/checkout/', orderData);
      alert(`Order Successful! Receipt ID: ${response.data.id}`);
      // Clear the cart after successful checkout
      setCart([]);
    } catch (err) {
      console.error("Checkout error:", err);
      // Show backend error message if stock is insufficient
      alert(err.response?.data?.error || "Checkout failed. Please try again.");
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', padding: '20px', gap: '20px' }}>
      
      {/* LEFT SIDE: Products Layout */}
      <div style={{ flex: 2, overflowY: 'auto' }}>
        <h2>Menu / Products</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          {products.map(product => (
            <button 
              key={product.id} 
              onClick={() => addToCart(product)}
              disabled={product.stock_quantity <= 0}
              style={{ 
                padding: '20px', 
                cursor: product.stock_quantity > 0 ? 'pointer' : 'not-allowed',
                backgroundColor: product.stock_quantity > 0 ? '#f0f8ff' : '#ffe4e1',
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
            >
              <h4>{product.name}</h4>
              <p>${product.price}</p>
              <small>Stock: {product.stock_quantity}</small>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Cart & Checkout Layout */}
      <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
        <h2>Current Order</h2>
        
        {/* Cart Items List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px' }}>
          {cart.length === 0 ? <p>No items added yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {cart.map(item => (
                <li key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                  <div>
                    <strong>{item.name}</strong> <br/>
                    <small>${item.unit_price} x {item.quantity}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>${item.item_subtotal.toFixed(2)}</strong> <br/>
                    <button onClick={() => removeFromCart(item.product_id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Order Summary & Payment */}
        <div style={{ borderTop: '2px solid #ccc', paddingTop: '10px' }}>
          <p>Subtotal: <span style={{ float: 'right' }}>${subtotal.toFixed(2)}</span></p>
          <p>Tax (5%): <span style={{ float: 'right' }}>${taxAmount.toFixed(2)}</span></p>
          <h3>Total: <span style={{ float: 'right' }}>${finalTotal.toFixed(2)}</span></h3>
          
          <select 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '10px', marginBottom: '10px' }}
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="EWALLET">E-Wallet</option>
          </select>

          <button 
            onClick={handleCheckout}
            style={{ width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', fontSize: '18px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Pay Now
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default Checkout;