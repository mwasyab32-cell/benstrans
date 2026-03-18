// Chatbox functionality for owner-admin messaging
class Chatbox {
    constructor() {
        this.currentConversation = null;
        this.currentReceiver = null;
        this.isMinimized = false;
        this.unreadCount = 0;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.createChatboxHTML();
        this.attachEventListeners();
        this.loadConversations();
        this.loadUnreadCount();
        
        // Auto-refresh every 10 seconds
        this.refreshInterval = setInterval(() => {
            if (!this.isMinimized) {
                this.loadConversations();
                this.loadUnreadCount();
                if (this.currentReceiver) {
                    this.loadMessages(this.currentReceiver);
                }
            }
        }, 10000);
    }

    createChatboxHTML() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isOwner = user.role === 'owner';
        
        const chatboxHTML = `
            <div class="chatbox-container" id="chatbox">
                <div class="chatbox-header" onclick="chatbox.toggleMinimize()">
                    <h3>💬 Messages</h3>
                    <div class="chatbox-header-actions">
                        <span class="unread-badge" id="unreadBadge" style="display: none;">0</span>
                        <button class="chatbox-toggle" id="chatboxToggle">−</button>
                    </div>
                </div>
                <div class="chatbox-body">
                    <!-- Conversations List -->
                    <div id="conversationsView">
                        ${isOwner ? '<button class="new-conversation-btn" onclick="chatbox.showNewConversation()">➕ New Message to Admin</button>' : ''}
                        <div class="conversations-list" id="conversationsList">
                            <div class="empty-state">
                                <div class="empty-state-icon">💬</div>
                                <div class="empty-state-text">No conversations yet</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Messages View -->
                    <div class="messages-view" id="messagesView">
                        <div class="messages-header">
                            <button class="back-btn" onclick="chatbox.backToConversations()">←</button>
                            <h4 id="conversationTitle">Messages</h4>
                        </div>
                        ${isOwner ? `
                        <div class="admin-select-container" id="adminSelectContainer" style="display: none;">
                            <select class="admin-select" id="adminSelect">
                                <option value="">Select an admin...</option>
                            </select>
                        </div>
                        ` : ''}
                        <div class="messages-container" id="messagesContainer">
                            <div class="empty-state">
                                <div class="empty-state-icon">📭</div>
                                <div class="empty-state-text">No messages yet</div>
                            </div>
                        </div>
                        <div class="message-input-container">
                            <form class="message-input-form" id="messageForm">
                                <input type="text" class="message-input" id="messageInput" placeholder="Type a message..." required autocomplete="off">
                                <button type="submit" class="send-btn">Send</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatboxHTML);
    }

    attachEventListeners() {
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }
        
        const adminSelect = document.getElementById('adminSelect');
        if (adminSelect) {
            adminSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.currentReceiver = parseInt(e.target.value);
                    this.loadMessages(this.currentReceiver);
                }
            });
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const chatbox = document.getElementById('chatbox');
        const toggle = document.getElementById('chatboxToggle');
        
        if (this.isMinimized) {
            chatbox.classList.add('minimized');
            toggle.textContent = '+';
        } else {
            chatbox.classList.remove('minimized');
            toggle.textContent = '−';
            this.loadConversations();
            this.loadUnreadCount();
        }
    }

    async loadUnreadCount() {
        try {
            const response = await fetch(`${API_BASE}/messages/unread-count`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.unreadCount = data.unread_count;
                
                const badge = document.getElementById('unreadBadge');
                if (this.unreadCount > 0) {
                    badge.textContent = this.unreadCount;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    }

    async loadConversations() {
        try {
            const response = await fetch(`${API_BASE}/messages/conversations`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                console.error('Failed to load conversations:', response.status, response.statusText);
                const errorData = await response.json().catch(() => ({}));
                console.error('Error details:', errorData);
                return;
            }
            
            const conversations = await response.json();
            this.renderConversations(conversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversations(conversations) {
        const container = document.getElementById('conversationsList');
        
        if (conversations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <div class="empty-state-text">No conversations yet</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        conversations.forEach(conv => {
            const time = this.formatTime(conv.last_message_at);
            const preview = conv.last_message ? conv.last_message.substring(0, 40) + '...' : 'No messages yet';
            const unreadBadge = conv.unread_count > 0 ? `<span class="conversation-unread">${conv.unread_count}</span>` : '';
            
            html += `
                <div class="conversation-item" onclick="chatbox.openConversation(${conv.other_user_id}, '${conv.other_user_name}')">
                    <div class="conversation-header">
                        <span class="conversation-name">${conv.other_user_name} ${unreadBadge}</span>
                        <span class="conversation-time">${time}</span>
                    </div>
                    <div class="conversation-preview">${preview}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async showNewConversation() {
        // Load admins
        try {
            const response = await fetch(`${API_BASE}/messages/admins`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const admins = await response.json();
                const adminSelect = document.getElementById('adminSelect');
                
                adminSelect.innerHTML = '<option value="">Select an admin...</option>';
                admins.forEach(admin => {
                    adminSelect.innerHTML += `<option value="${admin.id}">${admin.name} (${admin.email})</option>`;
                });
                
                // Show messages view with admin selector
                const conversationsView = document.getElementById('conversationsView');
                const messagesView = document.getElementById('messagesView');
                const adminSelectContainer = document.getElementById('adminSelectContainer');
                
                conversationsView.style.display = 'none';
                messagesView.classList.add('active');
                messagesView.style.display = 'flex';
                adminSelectContainer.style.display = 'block';
                
                document.getElementById('conversationTitle').textContent = 'New Message';
                document.getElementById('messagesContainer').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <div class="empty-state-text">Select an admin to start messaging</div>
                    </div>
                `;
                this.currentReceiver = null;
                
                console.log('New conversation view opened');
            }
        } catch (error) {
            console.error('Error loading admins:', error);
        }
    }

    async openConversation(userId, userName) {
        this.currentReceiver = userId;
        
        console.log('Opening conversation with:', userName, 'ID:', userId);
        
        // Hide conversations view
        const conversationsView = document.getElementById('conversationsView');
        const messagesView = document.getElementById('messagesView');
        
        conversationsView.style.display = 'none';
        messagesView.classList.add('active');
        messagesView.style.display = 'flex';
        
        document.getElementById('conversationTitle').textContent = userName;
        
        const adminSelectContainer = document.getElementById('adminSelectContainer');
        if (adminSelectContainer) {
            adminSelectContainer.style.display = 'none';
        }
        
        await this.loadMessages(userId);
        
        console.log('Messages view should now be visible');
    }

    async loadMessages(userId) {
        try {
            const response = await fetch(`${API_BASE}/messages/conversation/${userId}`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const messages = await response.json();
                this.renderMessages(messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        const currentUserId = JSON.parse(localStorage.getItem('user')).id;
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No messages yet. Start the conversation!</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        messages.forEach(msg => {
            const isSent = msg.sender_id === currentUserId;
            const time = this.formatTime(msg.created_at);
            
            html += `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-bubble">${this.escapeHtml(msg.message)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        if (!this.currentReceiver) {
            alert('Please select a recipient first');
            return;
        }
        
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        try {
            const response = await fetch(`${API_BASE}/messages/send`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    receiver_id: this.currentReceiver,
                    message: message
                })
            });
            
            if (response.ok) {
                input.value = '';
                await this.loadMessages(this.currentReceiver);
                await this.loadConversations();
            } else {
                const data = await response.json();
                alert('Failed to send message: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    }

    backToConversations() {
        const conversationsView = document.getElementById('conversationsView');
        const messagesView = document.getElementById('messagesView');
        
        conversationsView.style.display = 'block';
        messagesView.classList.remove('active');
        messagesView.style.display = 'none';
        
        this.currentReceiver = null;
        this.loadConversations();
        
        console.log('Back to conversations view');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }
        
        // Format as date
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        const chatboxElement = document.getElementById('chatbox');
        if (chatboxElement) {
            chatboxElement.remove();
        }
    }
}

// Initialize chatbox when page loads
let chatbox;
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Only initialize for owners and admins
    if (user.role === 'owner' || user.role === 'admin') {
        chatbox = new Chatbox();
    }
});
