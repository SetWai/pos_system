import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Products = () => {
    // State to store the list of products from backend
    const [products, setProducts] = useState([]);
    // State to handle loading UI
    const [loading, setLoading] = useState(true);
    // State to handle any API errors
    const [error, setError] = useState(null);

    // useEffect runs automatically when this component mounts (loads for the first time)
    useEffect(() => {
    // Function to fetch data
    const fetchProducts = async () => {
        try {
            // Makes a GET request to http://127.0.0.1:8000/api/products/
            const response = await api.get('/products/');
            
            // Store the received data into the 'products' state
            setProducts(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to load products. Is the Django backend running?");
            setLoading(false);
        }
    };

    fetchProducts();
    }, []); // The empty array [] means this effect runs ONLY once on page load

    // Show loading message while fetching data
    if (loading) return <div>Loading products...</div>;

    // Show error message if API fails
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Available Products</h2>
            
            {products.length === 0 ? (
            <p>No products available. Please add some from the Django admin panel.</p>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {/* Loop through the products array and render a card for each product */}
                {products.map((product) => (
                    <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                        <h3>{product.name}</h3>
                        {/* Note: category_name comes from the ReadOnlyField we added in Django Serializer */}
                        <p style={{ color: 'gray' }}>Category: {product.category_name}</p>
                        <p><strong>Price:</strong> ${product.price}</p>
                        <p><strong>Stock:</strong> {product.stock_quantity}</p>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
};

export default Products;