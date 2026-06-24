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

    // NEW STATES: Recall & Void Modals
    const [showRecallModal, setShowRecallModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [suspendedOrders, setSuspendedOrders] = useState([]);
    const [selectedVoidOrder, setSelectedVoidOrder] = useState(null);

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

    // Local Storage Helpers for Suspended Orders (Array Format)
    const getSuspendedOrders = () => JSON.parse(localStorage.getItem('suspended_pos_orders')) || [];
    const saveSuspendedOrders = (orders) => localStorage.setItem('suspended_pos_orders', JSON.stringify(orders));

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

    // ADVANCED POS FEATURES: SUSPEND, RECALL, VOID
    const handleSuspendTransaction = () => {
        if (cart.length === 0) return alert("Nothing to suspend. Cart is empty.");
        
        const referenceName = prompt("Enter a reference name for this suspended order (e.g., Table 5, Customer in red shirt):");
        if (!referenceName) return; // User cancelled

        const newSuspended = {
            id: Date.now(),
            name: referenceName,
            time: new Date().toLocaleTimeString(),
            items: cart,
            total: finalTotal
        };

        const existingOrders = getSuspendedOrders();
        saveSuspendedOrders([...existingOrders, newSuspended]);
        resetCartAndPayment();
        alert(`Transaction '${referenceName}' Suspended successfully.`);
    };

    const handleRecallTransaction = () => {
        setSuspendedOrders(getSuspendedOrders());
        setShowRecallModal(true);
    };

    const confirmRecallOrder = (order) => {
        if (cart.length > 0) {
            const confirmOverwrite = window.confirm("You have active items in your current cart. Recalling will clear them. Proceed?");
            if (!confirmOverwrite) return;
        }
        
        setCart(order.items);
        const updatedOrders = suspendedOrders.filter(o => o.id !== order.id);
        saveSuspendedOrders(updatedOrders);
        setShowRecallModal(false);
    };

    const handleVoidTransaction = () => {
        const passcode = prompt("Security Alert: Enter Admin Passcode (1234) to manage Voids:");
        if (passcode === '1234') { 
            setSuspendedOrders(getSuspendedOrders());
            setSelectedVoidOrder(null);
            setShowVoidModal(true);
        } else {
            alert("Access Denied: Invalid Admin Passcode.");
        }
    };

    const voidCurrentActiveCart = () => {
        if (cart.length === 0) return alert("Active cart is already empty.");
        if (window.confirm("Are you sure you want to completely VOID the current active transaction?")) {
            resetCartAndPayment();
        }
    };

    const voidEntireSuspendedOrder = (orderId) => {
        if (!window.confirm("Are you sure you want to delete this suspended transaction permanently?")) return;
        const updated = suspendedOrders.filter(o => o.id !== orderId);
        setSuspendedOrders(updated);
        saveSuspendedOrders(updated);
        if (selectedVoidOrder?.id === orderId) setSelectedVoidOrder(null);
    };

    const deleteItemFromSuspendedOrder = (orderId, productId) => {
        const updatedOrders = suspendedOrders.map(order => {
            if (order.id === orderId) {
                const newItems = order.items.filter(item => item.product_id !== productId);
                // Recalculate totals for the suspended order
                const newSubtotal = newItems.reduce((sum, item) => sum + item.item_subtotal, 0);
                const newTotal = newSubtotal + (newSubtotal * 0.05);
                return { ...order, items: newItems, total: newTotal };
            }
            return order;
        }).filter(order => order.items.length > 0); // Remove order completely if 0 items left

        setSuspendedOrders(updatedOrders);
        saveSuspendedOrders(updatedOrders);
        
        // Update the detail view if the order is still open
        if (selectedVoidOrder?.id === orderId) {
            const activeOrderNow = updatedOrders.find(o => o.id === orderId);
            setSelectedVoidOrder(activeOrderNow || null);
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
        const tenderedAmt = parseFloat(cashTendered) || 0;
        const changeAmt = tenderedAmt - finalTotal;

        const orderData = {
            cashier: 1, 
            payment_method: paymentMethod, 
            subtotal: subtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            discount_amount: 0,
            final_total: finalTotal.toFixed(2),
            items: cart,
            cash_tendered: paymentMethod === 'CASH' ? tenderedAmt.toFixed(2) : null,
            change_amount: paymentMethod === 'CASH' ? changeAmt.toFixed(2) : null,
            card_last4: paymentMethod === 'CARD' ? cardLast4 : null,
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

            {/* MODAL 2: RECALL ORDER MODAL */}
            {showRecallModal && (
                <div className="payment-modal-overlay">
                    <div className="management-modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}>Recall Suspended Transaction</h2>
                            <button onClick={() => setShowRecallModal(false)} className="remove-btn" style={{ fontSize: '24px' }}>&times;</button>
                        </div>
                        
                        <div className="modal-table-wrapper">
                            {suspendedOrders.length === 0 ? (
                                <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No suspended transactions found.</p>
                            ) : (
                                <table className="modal-table">
                                    <thead>
                                        <tr>
                                            <th>Reference Name</th>
                                            <th>Time</th>
                                            <th style={{ textAlign: 'center' }}>Total Items</th>
                                            <th style={{ textAlign: 'right' }}>Total Amount</th>
                                            <th style={{ textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suspendedOrders.map(order => (
                                            <tr key={order.id}>
                                                <td><strong>{order.name}</strong></td>
                                                <td>{order.time}</td>
                                                <td style={{ textAlign: 'center' }}>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${order.total.toFixed(2)}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button onClick={() => confirmRecallOrder(order)} className="btn-action btn-restore">Restore to Cart</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* ========================================= */}
            {/* MODAL 3: VOID MANAGER MODAL */}
            {/* ========================================= */}
            {showVoidModal && (
                <div className="payment-modal-overlay">
                    <div className="management-modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0, color: '#dc3545' }}>Void Management (Admin)</h2>
                            <button onClick={() => setShowVoidModal(false)} className="remove-btn" style={{ fontSize: '24px' }}>&times;</button>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            <button onClick={voidCurrentActiveCart} className="btn-action btn-delete" style={{ padding: '10px 15px' }}>
                                🚫 Void Current Active Screen Transaction
                            </button>
                        </div>

                        <div className="void-split-view">
                            {/* Left Side: List of Suspended Orders */}
                            <div className="void-left">
                                <h3 style={{ margin: '0 0 15px 0' }}>Suspended Orders</h3>
                                {suspendedOrders.length === 0 ? <p>No suspended orders.</p> : (
                                    <table className="modal-table">
                                        <tbody>
                                            {suspendedOrders.map(order => (
                                                <tr key={order.id} className={selectedVoidOrder?.id === order.id ? 'active-row' : ''}>
                                                    <td>
                                                        <strong>{order.name}</strong><br/>
                                                        <small>${order.total.toFixed(2)}</small>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button onClick={() => setSelectedVoidOrder(order)} className="btn-action btn-view">View</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Right Side: Items in the Selected Suspended Order */}
                            <div className="void-right">
                                <h3 style={{ margin: '0 0 15px 0' }}>
                                    {selectedVoidOrder ? `Items in '${selectedVoidOrder.name}'` : 'Select an order to view items'}
                                </h3>
                                
                                {selectedVoidOrder && (
                                    <>
                                        <div className="modal-table-wrapper" style={{ flexGrow: 1 }}>
                                            <table className="modal-table">
                                                <thead>
                                                    <tr>
                                                        <th>Item</th>
                                                        <th style={{ textAlign: 'center' }}>Qty</th>
                                                        <th style={{ textAlign: 'center' }}>Delete</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedVoidOrder.items.map(item => (
                                                        <tr key={item.product_id}>
                                                            <td>{item.name}</td>
                                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button onClick={() => deleteItemFromSuspendedOrder(selectedVoidOrder.id, item.product_id)} className="btn-action btn-delete" style={{ padding: '5px 10px' }}>
                                                                    X
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                            <button onClick={() => voidEntireSuspendedOrder(selectedVoidOrder.id)} className="btn-action btn-delete" style={{ padding: '12px 20px', width: '100%' }}>
                                                Void Entire Suspended Order
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;