const { createConnection } = require('./config/db');

async function setupMessaging() {
    console.log('Setting up messaging system...');
    
    try {
        const connection = await createConnection();
        
        // Create messages table
        console.log('Creating messages table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_sender (sender_id),
                INDEX idx_receiver (receiver_id),
                INDEX idx_created (created_at)
            )
        `);
        
        // Create conversations table
        console.log('Creating conversations table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                owner_id INT NOT NULL,
                admin_id INT NOT NULL,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_owner (owner_id),
                INDEX idx_admin (admin_id),
                UNIQUE KEY unique_conversation (owner_id, admin_id)
            )
        `);
        
        // Create message_attachments table
        console.log('Creating message_attachments table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS message_attachments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                message_id INT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50),
                file_size INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
                INDEX idx_message (message_id)
            )
        `);
        
        console.log('✅ Messaging tables created successfully!');
        console.log('\nTables created:');
        console.log('  - messages: Store all messages between users');
        console.log('  - conversations: Track owner-admin conversations');
        console.log('  - message_attachments: For future file attachments');
        
        await connection.end();
        
        console.log('\n✅ Messaging system setup complete!');
        console.log('\nNext steps:');
        console.log('1. Restart your server (node server.js)');
        console.log('2. Test the messaging API endpoints');
        console.log('3. Add chatbox UI to owner and admin dashboards');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

setupMessaging();
