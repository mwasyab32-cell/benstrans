// API_BASE is defined in auth.js

// Check if user is admin
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.role !== 'admin') {
    window.location.href = '../login.html';
}

document.getElementById('adminName').textContent = user.name;

// Tab Management
window.showTab = function(tabName) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab pane
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load data for the selected tab
    switch(tabName) {
        case 'pending-clients':
            loadPendingClients();
            break;
        case 'pending-owners':
            loadPendingOwners();
            break;
        case 'pending-vehicles':
            loadPendingVehicles();
            break;
        case 'all-vehicles':
            loadAllVehicles();
            break;
        case 'new-vehicles':
            loadNewVehicles();
            break;
        case 'all-users':
            loadAllUsers();
            break;
        case 'contact-messages':
            loadContactMessages();
            break;
    }
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        
        const [usersRes, vehiclesRes, bookingsRes, contactsRes] = await Promise.all([
            fetch(`${API_BASE}/admin/stats/users`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/admin/stats/vehicles`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/admin/stats/bookings`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/admin/stats/contacts`, { headers: getAuthHeaders() })
        ]);
        
        console.log('Response statuses:', usersRes.status, vehiclesRes.status, bookingsRes.status, contactsRes.status);
        
        if (!usersRes.ok || !vehiclesRes.ok || !bookingsRes.ok || !contactsRes.ok) {
            throw new Error('One or more API calls failed');
        }
        
        const users = await usersRes.json();
        const vehicles = await vehiclesRes.json();
        const bookings = await bookingsRes.json();
        const contacts = await contactsRes.json();
        
        console.log('Stats data:', { users, vehicles, bookings, contacts });
        
        document.getElementById('totalUsers').textContent = users.total_users || 0;
        document.getElementById('totalVehicles').textContent = vehicles.total_vehicles || 0;
        document.getElementById('newToday').textContent = vehicles.new_today || 0;
        document.getElementById('totalBookings').textContent = bookings.total_bookings || 0;
        document.getElementById('totalContacts').textContent = contacts.total_contacts || 0;
        
        console.log('Dashboard stats loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Set default values on error
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('totalVehicles').textContent = '0';
        document.getElementById('totalBookings').textContent = '0';
        document.getElementById('totalContacts').textContent = '0';
    }
}

// Load Pending Clients
async function loadPendingClients() {
    const content = document.getElementById('pendingClientsContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        console.log('Loading pending clients...');
        const response = await fetch(`${API_BASE}/admin/pending-clients`, {
            headers: getAuthHeaders()
        });
        
        console.log('Pending clients response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const clients = await response.json();
        console.log('Pending clients data:', clients);
        
        if (clients.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>No pending client approvals</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        clients.forEach(client => {
            html += `
                <tr>
                    <td>${client.name}</td>
                    <td>${client.email}</td>
                    <td>${client.phone}</td>
                    <td>${new Date(client.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn btn-approve" onclick="approveUser(${client.id})">Approve</button>
                        <button class="action-btn btn-reject" onclick="rejectUser(${client.id})">Reject</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading pending clients:', error);
        content.innerHTML = `<div class="empty-state"><p>Error loading pending clients: ${error.message}</p></div>`;
    }
}

// Load Pending Owners
async function loadPendingOwners() {
    const content = document.getElementById('pendingOwnersContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin/pending-owners`, {
            headers: getAuthHeaders()
        });
        
        const owners = await response.json();
        
        if (owners.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>No pending owner approvals</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        owners.forEach(owner => {
            html += `
                <tr>
                    <td>${owner.name}</td>
                    <td>${owner.email}</td>
                    <td>${owner.phone}</td>
                    <td>${new Date(owner.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn btn-approve" onclick="approveUser(${owner.id})">Approve</button>
                        <button class="action-btn btn-reject" onclick="rejectUser(${owner.id})">Reject</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><p>Error loading pending owners</p></div>';
    }
}

// Load Pending Vehicles
async function loadPendingVehicles() {
    const content = document.getElementById('pendingVehiclesContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin/pending-vehicles`, {
            headers: getAuthHeaders()
        });
        
        const vehicles = await response.json();
        
        if (vehicles.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <p>No pending vehicle approvals</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Vehicle Number</th>
                        <th>Owner</th>
                        <th>Route</th>
                        <th>Seats</th>
                        <th>Price</th>
                        <th>Reg. Fee</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        vehicles.forEach(vehicle => {
            const typeClass = vehicle.vehicle_type === 'bus' ? 'type-bus' : 'type-shuttle';
            html += `
                <tr>
                    <td><span class="status-badge ${typeClass}">${vehicle.vehicle_type}</span></td>
                    <td><strong>${vehicle.vehicle_number}</strong></td>
                    <td>${vehicle.owner_name}<br><small>${vehicle.owner_email}</small></td>
                    <td>${vehicle.route_from} → ${vehicle.route_to}</td>
                    <td>${vehicle.total_seats}</td>
                    <td>KSh ${vehicle.price}</td>
                    <td>KSh ${vehicle.registration_fee || 0}</td>
                    <td>${vehicle.registration_date || 'N/A'}</td>
                    <td>
                        <button class="action-btn btn-approve" onclick="approveVehicle(${vehicle.id})">Approve</button>
                        <button class="action-btn btn-reject" onclick="rejectVehicle(${vehicle.id})">Reject</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><p>Error loading pending vehicles</p></div>';
    }
}

// Load All Vehicles
async function loadAllVehicles() {
    const content = document.getElementById('allVehiclesContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin/all-vehicles`, {
            headers: getAuthHeaders()
        });
        
        const vehicles = await response.json();
        
        if (vehicles.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <p>No vehicles registered</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="margin-bottom: 15px;">
                <strong>Total Vehicles: ${vehicles.length}</strong>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Vehicle Number</th>
                        <th>Owner</th>
                        <th>Route</th>
                        <th>Seats</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        vehicles.forEach(vehicle => {
            const typeClass = vehicle.vehicle_type === 'bus' ? 'type-bus' : 'type-shuttle';
            const statusClass = vehicle.status === 'approved' ? 'status-approved' : vehicle.status === 'pending' ? 'status-pending' : 'status-rejected';
            html += `
                <tr>
                    <td><span class="status-badge ${typeClass}">${vehicle.vehicle_type}</span></td>
                    <td><strong>${vehicle.vehicle_number}</strong></td>
                    <td>${vehicle.owner_name}<br><small>${vehicle.owner_email}</small></td>
                    <td>${vehicle.route_from} → ${vehicle.route_to}</td>
                    <td>${vehicle.total_seats}</td>
                    <td>KSh ${vehicle.price}</td>
                    <td><span class="status-badge ${statusClass}">${vehicle.status}</span></td>
                    <td>${vehicle.registration_date || 'N/A'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><p>Error loading vehicles</p></div>';
    }
}

// Load New Vehicles
async function loadNewVehicles() {
    const content = document.getElementById('newVehiclesContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        console.log('Loading new vehicles...');
        const response = await fetch(`${API_BASE}/admin/new-vehicles`, {
            headers: getAuthHeaders()
        });
        
        console.log('New vehicles response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const vehicles = await response.json();
        console.log('New vehicles data:', vehicles);
        
        if (vehicles.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <p>No new vehicles in the last 7 days</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Vehicle Number</th>
                        <th>Owner</th>
                        <th>Route</th>
                        <th>Seats</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        vehicles.forEach(vehicle => {
            const typeClass = vehicle.vehicle_type === 'bus' ? 'type-bus' : 'type-shuttle';
            const statusClass = vehicle.status === 'approved' ? 'status-approved' : vehicle.status === 'pending' ? 'status-pending' : 'status-rejected';
            html += `
                <tr>
                    <td><span class="status-badge ${typeClass}">${vehicle.vehicle_type}</span></td>
                    <td><strong>${vehicle.vehicle_number}</strong></td>
                    <td>${vehicle.owner_name}<br><small>${vehicle.owner_email}</small></td>
                    <td>${vehicle.route_from} → ${vehicle.route_to}</td>
                    <td>${vehicle.total_seats}</td>
                    <td>KSh ${vehicle.price}</td>
                    <td><span class="status-badge ${statusClass}">${vehicle.status}</span></td>
                    <td>${vehicle.registration_date || 'N/A'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading new vehicles:', error);
        content.innerHTML = `<div class="empty-state"><p>Error loading new vehicles: ${error.message}</p></div>`;
    }
}

// Load All Users
async function loadAllUsers() {
    const content = document.getElementById('allUsersContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin/all-users`, {
            headers: getAuthHeaders()
        });
        
        const users = await response.json();
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        users.forEach(user => {
            const statusClass = user.status === 'approved' ? 'status-approved' : 'status-pending';
            html += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="status-badge">${user.role}</span></td>
                    <td><span class="status-badge ${statusClass}">${user.status}</span></td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><p>Error loading users</p></div>';
    }
}

// Load Contact Messages
async function loadContactMessages() {
    const content = document.getElementById('contactMessagesContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        console.log('Loading contact messages...');
        const response = await fetch(`${API_BASE}/contact`, {
            headers: getAuthHeaders()
        });
        
        console.log('Contact messages response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const messages = await response.json();
        console.log('Contact messages data:', messages);
        
        if (messages.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📧</div>
                    <p>No contact messages</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        messages.forEach(message => {
            const statusClass = message.status === 'new' ? 'status-new' : 'status-approved';
            html += `
                <tr>
                    <td>${message.name}</td>
                    <td>${message.email}</td>
                    <td>${message.subject}</td>
                    <td>${new Date(message.created_at).toLocaleDateString()}</td>
                    <td><span class="status-badge ${statusClass}">${message.status}</span></td>
                    <td>
                        <button class="action-btn btn-view" onclick="viewMessage(${message.id})">View</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading contact messages:', error);
        content.innerHTML = `<div class="empty-state"><p>Error loading messages: ${error.message}</p></div>`;
    }
}

// Approve User
async function approveUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/admin/approve-user/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showAlert('User approved successfully!', 'success');
            loadPendingOwners();
            loadDashboardStats();
        }
    } catch (error) {
        showAlert('Error approving user', 'error');
    }
}

// Approve Vehicle
async function approveVehicle(vehicleId) {
    try {
        const response = await fetch(`${API_BASE}/admin/approve-vehicle/${vehicleId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showAlert('Vehicle approved successfully!', 'success');
            loadPendingVehicles();
            loadDashboardStats();
        }
    } catch (error) {
        showAlert('Error approving vehicle', 'error');
    }
}

// View Message Modal
async function viewMessage(messageId) {
    try {
        const response = await fetch(`${API_BASE}/contact/${messageId}`, {
            headers: getAuthHeaders()
        });
        
        const message = await response.json();
        
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>From:</strong> ${message.name} (${message.email})
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Phone:</strong> ${message.phone || 'Not provided'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Subject:</strong> ${message.subject}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Date:</strong> ${new Date(message.created_at).toLocaleString()}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Message:</strong>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
                    ${message.message}
                </div>
            </div>
        `;
        
        document.getElementById('messageModal').style.display = 'block';
    } catch (error) {
        showAlert('Error loading message details', 'error');
    }
}

// Close Modal
function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}

// Show Alert
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}" style="position: fixed; top: 20px; right: 20px; z-index: 1001; padding: 15px; border-radius: 5px; background: ${type === 'success' ? '#d4edda' : '#f8d7da'}; color: ${type === 'success' ? '#155724' : '#721c24'};">${message}</div>`;
    
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadPendingOwners();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('messageModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Reject Vehicle
async function rejectVehicle(vehicleId) {
    try {
        const response = await fetch(`${API_BASE}/admin/reject-vehicle/${vehicleId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showAlert('Vehicle rejected', 'success');
            loadPendingVehicles();
            loadDashboardStats();
        }
    } catch (error) {
        showAlert('Error rejecting vehicle', 'error');
    }
}

// Make functions globally accessible
window.showTab = showTab;
window.approveUser = approveUser;
window.approveVehicle = approveVehicle;
window.rejectUser = function(userId) { console.log('Reject user:', userId); };
window.rejectVehicle = rejectVehicle;
window.closeModal = closeModal;
window.loadPendingClients = loadPendingClients;
window.loadPendingOwners = loadPendingOwners;
window.loadPendingVehicles = loadPendingVehicles;
window.loadAllVehicles = loadAllVehicles;
window.loadNewVehicles = loadNewVehicles;
window.loadAllUsers = loadAllUsers;
window.loadContactMessages = loadContactMessages;