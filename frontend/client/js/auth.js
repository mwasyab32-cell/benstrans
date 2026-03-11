// Minimal auth helpers to prevent 404 and provide basic auth utilities
const API_BASE = 'https://benstrans.onrender.com/api';
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login.html';
}

console.log('auth.js loaded');
