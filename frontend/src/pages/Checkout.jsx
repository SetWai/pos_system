import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Checkout = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [barcodeInput, setBarcodeInput] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
    // We still fetch products in the background so the scanner can verify barcodes
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

    const handleBarcodeSubmit = (e) => {
        if (e) e.preventDefault();
    
        let inputStr = barcodeInput.trim();
        if (!inputStr) return;
    
        let qty = 1;
        let code = inputStr;
    
        // Check if input contains the multiplication symbol '*'
        if (inputStr.includes('*')) {
          const parts = inputStr.split('*');
          qty = parseInt(parts[0], 10) || 1; // Default to 1 if NaN
          code = parts[1];
        }
    
        const scannedProduct = products.find(p => p.barcode === code);
        
        if (scannedProduct) {
          if (scannedProduct.stock_quantity >= qty) {
            addToCart(scannedProduct, qty);
            setBarcodeInput(''); // Clear input after success
          } else {
            alert(`Not enough stock! Only ${scannedProduct.stock_quantity} available.`);
            setBarcodeInput('');
          }
        } else {
          alert("Product not found! Please check the barcode.");
          setBarcodeInput('');
        }
    };

    const addToCart = (product, qtyToAdd = 1) => {
        const existingItem = cart.find(item => item.product_id === product.id);
        
        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + qtyToAdd);
        } else {
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                barcode: product.barcode, 
                unit_price: parseFloat(product.price),
                quantity: qtyToAdd, 
                item_subtotal: parseFloat(product.price) * qtyToAdd,
                max_stock: product.stock_quantity 
            }]);
        }
    };

    // NEW: Advanced Quantity Management
    const updateQuantity = (productId, newQuantity) => {
        // Ensure quantity doesn't drop below 1 or exceed available stock
        const parsedQuantity = parseInt(newQuantity, 10);

        if (isNaN(parsedQuantity) || parsedQuantity < 1) return;

        setCart(cart.map(item => {
            if (item.product_id === productId) {
                if (parsedQuantity > item.max_stock) {
                    alert(`Only ${item.max_stock} items left in stock!`);
                    return item; // Keep previous quantity
                }
                return { 
                    ...item, 
                    quantity: parsedQuantity, 
                    item_subtotal: parsedQuantity * item.unit_price 
                };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.item_subtotal, 0);
    const taxRate = 0.05;
    const taxAmount = subtotal * taxRate;
    const finalTotal = subtotal + taxAmount;

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty!");
        const orderData = {
          cashier: 1, 
          payment_method: paymentMethod,
          subtotal: subtotal.toFixed(2),
          tax_amount: taxAmount.toFixed(2),
          discount_amount: 0,
          final_total: finalTotal.toFixed(2),
          items: cart
        };
        try {
          const response = await api.post('/checkout/', orderData);
          setCart([]); 
          navigate(`/receipt/${response.data.id}`);
        } catch (err) {
          alert(err.response?.data?.error || "Checkout failed.");
        }
    };
    // Function to handle on-screen numpad clicks
    const handleNumpadClick = (value) => {
        setBarcodeInput(prev => prev + value);
    };

    // NEW: Function to handle backspace (delete last character)
    const handleBackspace = () => {
        setBarcodeInput(prev => prev.slice(0, -1));
    };
    return (
    <div style={{ display: 'flex', height: '100vh', padding: '20px', gap: '20px' }}>
        
        {/* LEFT SIDE: Barcode Scanner & Numpad */}
      <div style={{ flex: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column' }}>
        <h2>POS Scanner</h2>
        
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', color: '#000' }}>
          <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Scan or Enter [Qty * Barcode]</label>
            <input 
              type="text" 
              placeholder="e.g. 5*1111 or 1111" 
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              style={{ padding: '15px', fontSize: '20px', borderRadius: '5px', border: '2px solid #007bff', textAlign: 'center' }}
              autoFocus 
            />
            
            {/* NUMPAD UI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
              {['7','8','9','4','5','6','1','2','3','0','*'].map(num => (
                <button 
                  key={num} type="button" onClick={() => handleNumpadClick(num)}
                  style={{ padding: '20px', fontSize: '20px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}
                >
                  {num}
                </button>
              ))}
              <button 
                type="button" 
                onClick={handleBackspace} 
                style={{ padding: '20px', fontSize: '24px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                ⌫
              </button>
            </div>

            <button 
              type="submit" 
              style={{ padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '22px', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            >
              Enter <span>↵</span>
            </button>
          </form>
        </div>

        <button onClick={() => navigate('/products')} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Lookup Products
        </button>
      </div>

        {/* RIGHT SIDE: Enhanced Cart Layout */}
        <div className="cart-panel" style={{ flex: 2, padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
        <h2>Current Order</h2>
        
        {/* Table layout for professional look */}
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px' }}>
            {cart.length === 0 ? <p>Waiting for scan...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '10px' }}>Code</th>
                    <th style={{ padding: '10px' }}>Item Name</th>
                    <th style={{ padding: '10px' }}>Unit Price</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Subtotal</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {cart.map(item => (
                    <tr key={item.product_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}><small>{item.barcode}</small></td>
                    <td style={{ padding: '10px' }}><strong>{item.name}</strong></td>
                    <td style={{ padding: '10px' }}>${item.unit_price.toFixed(2)}</td>
                    
                    {/* NEW: Input field for quick quantity update */}
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input 
                        type="number" 
                        min="1" 
                        max={item.max_stock}
                        value={item.quantity} 
                        onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                        style={{ width: '60px', padding: '5px', textAlign: 'center' }}
                        />
                    </td>
                    
                    <td style={{ padding: '10px', textAlign: 'right' }}>${item.item_subtotal.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => removeFromCart(item.product_id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            )}
        </div>

        {/* Totals Section */}
        <div style={{ borderTop: '2px solid #ccc', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ width: '40%' }}>
            <label>Payment Method:</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '12px', marginTop: '5px' }}>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="EWALLET">E-Wallet</option>
            </select>
            </div>
            
            <div style={{ width: '40%', textAlign: 'right' }}>
                <p>Subtotal: ${subtotal.toFixed(2)}</p>
                <p>Tax (5%): ${taxAmount.toFixed(2)}</p>
                <h2 style={{ color: '#28a745' }}>Total: ${finalTotal.toFixed(2)}</h2>
            </div>
        </div>
        
        <button onClick={handleCheckout} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#28a745', color: 'white', fontSize: '18px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>
            Checkout & Print Receipt
        </button>

        </div>
    </div>
    );
};

export default Checkout;