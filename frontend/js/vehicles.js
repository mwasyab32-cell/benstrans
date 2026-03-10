// Vehicle related functions
const API_BASE = 'https://benstrans.onrender.com/api';

// Register a new vehicle
async function registerVehicle(vehicleData) {
    try {
        const response = await fetch(`${API_BASE}/vehicles/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(vehicleData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error registering vehicle:', error);
        throw error;
    }
}

// Get owner's vehicles
async function getOwnerVehicles() {
    try {
        const response = await fetch(`${API_BASE}/vehicles/my-vehicles`, {
            headers: getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return [];
    }
}

// Admin functions
async function getPendingOwners() {
    try {
        const response = await fetch(`${API_BASE}/admin/pending-owners`, {
            headers: getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching pending owners:', error);
        return [];
    }
}

async function getPendingVehicles() {
    try {
        const response = await fetch(`${API_BASE}/admin/pending-vehicles`, {
            headers: getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching pending vehicles:', error);
        return [];
    }
}

async function approveUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/admin/approve-user/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error approving user:', error);
        throw error;
    }
}

async function approveVehicle(vehicleId) {
    try {
        const response = await fetch(`${API_BASE}/admin/approve-vehicle/${vehicleId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error approving vehicle:', error);
        throw error;
    }
}