import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    // useNavigate is a React Router hook to redirect users to another page programmatically
    const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    try {
        // Send credentials to Django JWT endpoint
        const response = await api.post('/token/', {
            username,
            password
        });

        // Save tokens in browser's localStorage
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        // Redirect to the Dashboard after successful login
        navigate('/');
        
        // Force a page reload to update the navigation bar state (simple approach)
        window.location.reload(); 
    } catch (err) {
        console.error("Login failed:", err);
        setError("Invalid username or password");
    }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <form onSubmit={handleLogin} style={{ width: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', color: '#000' }}>
            <h2 style={{ textAlign: 'center' }}>POS Login</h2>
            
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            
            <div style={{ marginBottom: '15px' }}>
                <label>Username</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    required
                />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
                <label>Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    required
                />
            </div>
            
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Login
            </button>
            </form>
        </div>
    );
};

export default Login;