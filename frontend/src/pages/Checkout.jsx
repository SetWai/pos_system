import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Checkout.css';

const Checkout = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH'); 
    
    // NEW STATES FOR PAYMENT MODAL
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [cashTendered, setCashTendered] = useState('');
    const [cardLast4, setCardLast4] = useState('');

    const navigate = useNavigate();

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

    const handleBarcodeSubmit = (e) => {
        if (e) e.preventDefault();
        let inputStr = barcodeInput.trim();
        if (!inputStr) return;

        let qty = 1;
        let code = inputStr;

        if (inputStr.includes('*')) {
            const parts = inputStr.split('*');
            qty = parseInt(parts[0], 10) || 1;
            code = parts[1];
        }

        const scannedProduct = products.find(p => p.barcode === code);
        
        if (scannedProduct) {
            if (scannedProduct.stock_quantity >= qty) {
                addToCart(scannedProduct, qty);
                setBarcodeInput('');
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

    const updateQuantity = (productId, newQuantity) => {
        const parsedQuantity = parseInt(newQuantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) return;

        setCart(cart.map(item => {
            if (item.product_id === productId) {
                if (parsedQuantity > item.max_stock) {
                    alert(`Only ${item.max_stock} items left in stock!`);
                    return item;
                }
                return { ...item, quantity: parsedQuantity, item_subtotal: parsedQuantity * item.unit_price };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const resetCartAndPayment = () => {
        setCart([]);
        setBarcodeInput('');
        setCashTendered('');
        setCardLast4('');
        setShowPaymentModal(false);
    };

    const handleVoidTransaction = () => {
        if (cart.length === 0) return;
        const passcode = prompt("Security Alert: Enter Admin Passcode to VOID current transaction:");
        if (passcode === '1234') { 
            resetCartAndPayment();
            alert("Transaction has been successfully voided.");
        } else {
            alert("Access Denied: Invalid Admin Passcode.");
        }
    };

    const handleSuspendTransaction = () => {
        if (cart.length === 0) return alert("Nothing to suspend. Cart is empty.");
        localStorage.setItem('suspended_pos_cart', JSON.stringify(cart));
        resetCartAndPayment();
        alert("Transaction Suspended successfully. Ready for next customer.");
    };

    const handleRecallTransaction = () => {
        const savedCart = localStorage.getItem('suspended_pos_cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
            localStorage.removeItem('suspended_pos_cart');
            alert("Suspended transaction successfully recalled.");
        } else {
            alert("No suspended transaction found.");
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + item.item_subtotal, 0);
    const taxAmount = subtotal * 0.05;
    const finalTotal = subtotal + taxAmount;

    // 1. Triggered when Cash Out is clicked
    const handleCheckoutClick = () => {
        if (cart.length === 0) return alert("Cart is empty!");
        setShowPaymentModal(true); // Open the center modal instead of checking out immediately
    };

    // 2. Triggered when Confirm is clicked inside the Modal
    const confirmPayment = async () => {
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
            resetCartAndPayment(); 
            navigate(`/receipt/${response.data.id}`);
        } catch (err) {
            alert(err.response?.data?.error || "Checkout failed.");
        }
    };

    const handleNumpadClick = (value) => setBarcodeInput(prev => prev + value);
    const handleBackspace = () => setBarcodeInput(prev => prev.slice(0, -1));

    // Calculate dynamic values for the modal
    const tenderedAmt = parseFloat(cashTendered) || 0;
    const isCashEnough = tenderedAmt >= finalTotal;
    const changeAmt = tenderedAmt - finalTotal;
    
    // Check if the Confirm button should be disabled
    const isConfirmDisabled = 
        (paymentMethod === 'CASH' && !isCashEnough) || 
        (paymentMethod === 'CARD' && cardLast4.length !== 4);

    return (
        <div className="checkout-wrapper">
            
            {/* LEFT SIDE: SCANNING AREA */}
            <div className="scanner-panel">
                <h2 style={{ margin: '0 0 15px 0' }}>POS Scanner Counter</h2>
                <div className="scanner-top-section">
                    <form onSubmit={handleBarcodeSubmit} className="scanner-top-form">
                        <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Scan or Enter [Qty * Barcode]</label>
                        <input 
                            type="text" 
                            placeholder="e.g. 5*1111 or 1111" 
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            className="barcode-input"
                            autoFocus 
                        />
                        <div className="numpad-grid">
                            {['7','8','9','4','5','6','1','2','3','0','*'].map(num => (
                                <button key={num} type="button" onClick={() => handleNumpadClick(num)} className="num-btn">{num}</button>
                            ))}
                            <button type="button" onClick={handleBackspace} className="del-btn">⌫</button>
                        </div>
                        <button type="submit" className="enter-btn">↵</button>
                    </form>
                </div>
                <div className="scanner-bottom-section">
                    <div className="action-grid">
                        <button type="button" onClick={handleVoidTransaction} className="square-btn btn-void">Void<br/>Transaction</button>
                        <button type="button" onClick={handleSuspendTransaction} className="square-btn btn-suspend">Suspend<br/>Order</button>
                        <button type="button" onClick={handleRecallTransaction} className="square-btn btn-recall">Recall<br/>Order</button>
                        <button type="button" onClick={() => navigate('/products')} className="square-btn btn-lookup">Lookup<br/>Products</button>
                        <button type="button" onClick={() => { setPaymentMethod('CASH'); setCashTendered(''); setCardLast4(''); }} className={`payment-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}>Cash<br/>Payment</button>
                        <button type="button" onClick={() => { setPaymentMethod('CARD'); setCashTendered(''); setCardLast4(''); }} className={`payment-btn ${paymentMethod === 'CARD' ? 'active' : ''}`}>Card<br/>Payment</button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: CURRENT ORDER AREA */}
            <div className="order-panel">
                <h2 style={{ margin: '0 0 15px 0' }}>Current Order</h2>
                <div className="order-top-section">
                    {cart.length === 0 ? <p style={{ color: '#666' }}>Waiting for scan...</p> : (
                        <table className="cart-table">
                            <thead>
                                <tr><th>Item</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Subtotal</th><th></th></tr>
                            </thead>
                            <tbody>
                                {cart.map(item => (
                                    <tr key={item.product_id}>
                                        <td>{item.name} <br/><small><code style={{color: 'gray'}}>{item.barcode}</code></small></td>
                                        <td style={{ textAlign: 'center' }}><input type="number" min="1" max={item.max_stock} value={item.quantity} onChange={(e) => updateQuantity(item.product_id, e.target.value)} className="qty-input" /></td>
                                        <td style={{ textAlign: 'right' }}>${item.item_subtotal.toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}><button onClick={() => removeFromCart(item.product_id)} className="remove-btn">X</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="order-bottom-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div><p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Method: <strong>{paymentMethod}</strong></p></div>
                        <div style={{ textAlign: 'right', fontSize: '16px' }}>
                            <p style={{ margin: '3px 0' }}>Subtotal: <span style={{ fontWeight: 'bold' }}>${subtotal.toFixed(2)}</span></p>
                            <p style={{ margin: '3px 0' }}>Tax (5%): <span style={{ fontWeight: 'bold' }}>${taxAmount.toFixed(2)}</span></p>
                            <h2 style={{ color: '#28a745', margin: '5px 0', fontSize: '24px' }}>Total: ${finalTotal.toFixed(2)}</h2>
                        </div>
                    </div>
                    {/* Changed onClick to handleCheckoutClick to open Modal */}
                    <button onClick={handleCheckoutClick} className="cashout-btn">Cash Out</button>
                </div>
            </div>

            {/* ========================================= */}
            {/* FULL SCREEN PAYMENT MODAL (CENTERED ROUTE) */}
            {/* ========================================= */}
            {showPaymentModal && (
                <div className="payment-modal-overlay">
                    <div className="payment-modal-box">
                        <h2 className="modal-title">
                            {paymentMethod === 'CASH' ? 'Cash Payment' : 'Card Payment'}
                        </h2>
                        
                        <p className="modal-label">Total Amount Due</p>
                        <div className="modal-amount">${finalTotal.toFixed(2)}</div>

                        {paymentMethod === 'CASH' ? (
                            <>
                                <p className="modal-label">Enter Cash Tendered</p>
                                <input 
                                    type="number" 
                                    autoFocus
                                    className="modal-input" 
                                    placeholder="0.00"
                                    value={cashTendered}
                                    onChange={(e) => setCashTendered(e.target.value)}
                                />
                                
                                {cashTendered && isCashEnough ? (
                                    <p className="modal-change">Change: ${changeAmt.toFixed(2)}</p>
                                ) : cashTendered && !isCashEnough ? (
                                    <p className="modal-error">Need ${Math.abs(changeAmt).toFixed(2)} more!</p>
                                ) : (
                                    <p style={{height: '26px', margin: 0}}></p> /* Spacer */
                                )}
                            </>
                        ) : (
                            <>
                                <p className="modal-label">Enter Last 4 Digits of Card</p>
                                <input 
                                    type="text" 
                                    autoFocus
                                    maxLength="4"
                                    className="modal-input" 
                                    placeholder="e.g. 1234"
                                    value={cardLast4}
                                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                                />
                            </>
                        )}

                        <div className="modal-buttons">
                            <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                                Back
                            </button>
                            <button 
                                className="btn-confirm" 
                                onClick={confirmPayment} 
                                disabled={isConfirmDisabled}
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;