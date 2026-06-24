import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Receipt = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await api.get(`/orders/${id}/`);
                setOrder(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch order details", err);
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [id]);

    const handlePrint = () => {
        window.print(); // Triggers the browser's native print dialog
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Receipt...</div>;
    if (!order) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Order not found!</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh', color: '#000' }}>
            
            {/* Action Buttons (Hidden during printing) */}
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => navigate('/checkout')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
                    ← Back to POS
                </button>
                <button onClick={handlePrint} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Print Receipt
                </button>
                <Link to="/checkout" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                    New Order
                </Link>
            </div>

            {/* Receipt Paper UI */}
            <div id="receipt-paper" style={{ 
                width: '300px', // Standard thermal printer width
                backgroundColor: 'white', 
                padding: '20px', 
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                fontFamily: 'monospace' // Typewriter style font commonly used in receipts
            }}>
            <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>SUPERMARKET POS</h2>
            <p style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '12px', color: '#555' }}>
                123 Main Street, City<br/>
                Tel: +123 456 789
            </p>
            
            <p style={{ fontSize: '12px' }}>
                <strong>Receipt No:</strong> #{order.id}<br/>
                <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}<br/>
                <strong>Cashier:</strong> {order.cashier_name || 'Admin'}
            </p>

            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '10px 0', margin: '10px 0' }}>
                <table style={{ width: '100%', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                    <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map(item => (
                    <tr key={item.id}>
                        <td style={{ paddingTop: '5px' }}>{item.product_name}</td>
                        <td style={{ textAlign: 'center', paddingTop: '5px' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', paddingTop: '5px' }}>${item.item_subtotal}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            <div style={{ textAlign: 'right', fontSize: '14px', marginBottom: '20px' }}>
                <p style={{ margin: '5px 0' }}>Subtotal: ${order.subtotal}</p>
                <p style={{ margin: '5px 0' }}>Tax (5%): ${order.tax_amount}</p>
                <h3 style={{ margin: '5px 0' }}>TOTAL: ${order.final_total}</h3>
            </div>

            {/* DYNAMIC PAYMENT DETAILS */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                            <span>Method:</span>
                            <strong>{order.payment_method}</strong>
                        </div>

                        {order.payment_method === 'CASH' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                                    <span>Cash Tendered:</span>
                                    <span>${parseFloat(order.cash_tendered || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontWeight: 'bold' }}>
                                    <span>Change:</span>
                                    <span>${parseFloat(order.change_amount || 0).toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        {order.payment_method === 'CARD' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                                <span>Card Number:</span>
                                <span>**** **** **** {order.card_last4}</span>
                            </div>
                        )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '13px' }}>
                    <p style={{ margin: 0 }}>Thank you for shopping with us!</p>
                    <p style={{ margin: 0 }}>Please come again.</p>
                </div>
            </div>

            {/* CSS to hide buttons when actual printing happens */}
            <style>
            {`
                @media print {
                body * {
                    visibility: hidden;
                }
                #receipt-paper, #receipt-paper * {
                    visibility: visible;
                }
                #receipt-paper {
                    position: absolute;
                    left: 0;
                    top: 0;
                    box-shadow: none;
                    width: 100%;
                }
                .no-print {
                    display: none !important;
                }
                }
            `}
            </style>
        </div>
    );
};

export default Receipt;