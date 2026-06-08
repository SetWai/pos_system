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
    e.preventDefault();
    const scannedProduct = products.find(p => p.barcode === barcodeInput);

    if (scannedProduct) {
        if (scannedProduct.stock_quantity > 0) {
        addToCart(scannedProduct);
        setBarcodeInput('');
        } else {
        alert("This item is out of stock!");
        setBarcodeInput('');
        }
    } else {
        alert("Product not found! Please check the barcode.");
        setBarcodeInput('');
    }
    };

    const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
        updateQuantity(product.id, existingItem.quantity + 1);
    } else {
        setCart([...cart, {
        product_id: product.id,
        name: product.name,
        barcode: product.barcode, // Added barcode for display
        unit_price: parseFloat(product.price),
        quantity: 1,
        item_subtotal: parseFloat(product.price),
        max_stock: product.stock_quantity // Store max stock to validate later
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
    // ... (Your existing checkout logic remains exactly the same)
    };

    return (
    <div style={{ display: 'flex', height: '100vh', padding: '20px', gap: '20px' }}>
        
        {/* LEFT SIDE: ONLY Scanner & Quick Actions (Removed full product list) */}
        <div style={{ flex: 1, paddingRight: '10px' }}>
        <h2>POS Terminal</h2>
        
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#333' }}>Scan Barcode</label>
            <input 
                type="text" 
                placeholder="e.g. 123456" 
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                style={{ padding: '15px', fontSize: '18px', borderRadius: '5px', border: '2px solid #007bff' }}
                autoFocus 
            />
            <button type="submit" style={{ padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}>
                Add to Cart
            </button>
            </form>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Cashier Actions</h3>
            {/* Button to navigate to the separate products page */}
            <button onClick={() => navigate('/products')} style={{ width: '100%', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Lookup Products
            </button>
        </div>
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
            <p style={{ margin: '5px 0' }}>Subtotal: ${subtotal.toFixed(2)}</p>
            <p style={{ margin: '5px 0' }}>Tax (5%): ${taxAmount.toFixed(2)}</p>
            <h2 style={{ margin: '10px 0', color: '#28a745' }}>Total: ${finalTotal.toFixed(2)}</h2>
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