import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Makes a GET request to http://127.0.0.1:8000/api/products/
                const response = await api.get('/products/');
                setProducts(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError("Failed to load products. Is the Django backend running?");
                setLoading(false);
            }
        };
        fetchProducts();
    }, []); 
    const categories = ['All', ...new Set(products.map(p => p.category_name || p.category || 'Uncategorized'))];
    const filteredProducts = products.filter(product => {
        const matchesSearch = 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            product.barcode.includes(searchTerm);
            
        const catName = product.category_name || product.category || 'Uncategorized';
        const matchesCategory = selectedCategory === 'All' || catName === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const getStockBadgeClass = (qty) => {
        if (qty <= 0) return 'stock-badge stock-out';
        if (qty <= 10) return 'stock-badge stock-low'; 
        return 'stock-badge stock-high';
    };
    if (loading) return <div>Loading products...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="products-wrapper">
            <div className="products-container">
                
                {/* Header */}
                <div className="products-header">
                    <h1 style={{ margin: 0 }}>Product Lookup</h1>
                    <button className="back-btn" onClick={() => navigate('/checkout')}>
                        ← Back to POS
                    </button>
                </div>

                {/* Search & Filter Controls */}
                <div className="controls-bar">
                    <input 
                        type="text" 
                        placeholder="🔍 Search by Product Name or Barcode..." 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    
                    <select 
                        className="filter-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map((cat, index) => (
                            <option key={index} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Products Table */}
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '20px', fontSize: '18px' }}>Loading products...</p>
                    ) : filteredProducts.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', fontSize: '18px', color: '#dc3545' }}>
                            No products found matching your search.
                        </p>
                    ) : (
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Barcode</th>
                                    <th>Category</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
                                    <th style={{ textAlign: 'center' }}>Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(product => (
                                    <tr key={product.id}>
                                        <td style={{ fontWeight: 'bold' }}>{product.name}</td>
                                        <td>
                                            <span className="barcode-badge">{product.barcode}</span>
                                        </td>
                                        <td>{product.category_name || product.category || 'N/A'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                                            ${parseFloat(product.price).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={getStockBadgeClass(product.stock_quantity)}>
                                                {product.stock_quantity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Products;