const { createConnection } = require('./config/db');

async function testMessaging() {
    console.log('Testing messaging system...\n');
    
    try {
        const connection = await createConnection();
        
        // Check if tables exist
        console.log('1. Checking if messaging tables exist...');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'bensdb' 
            AND TABLE_NAME IN ('messages', 'conversations', 'message_attachments')
        `);
        
        console.log('   Found tables:', tables.map(t => t.TABLE_NAME).join(', '));
        
        if (tables.length !== 3) {
            console.log('   ❌ Not all tables found. Run setup-messaging.js first.');
            await connection.end();
            return;
        }
        
        console.log('   ✅ All messaging tables exist\n');
        
        // Check for test users
        console.log('2. Checking for test users...');
        const [owners] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE role = "owner" LIMIT 1'
        );
        const [admins] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin" LIMIT 1'
        );
        
        if (owners.length === 0 || admins.length === 0) {
            console.log('   ❌ Need at least one owner and one admin user');
            console.log('   Create users first using the registration system');
            await connection.end();
            return;
        }
        
        const owner = owners[0];
        const admin = admins[0];
        
        console.log(`   Owner: ${owner.name} (${owner.email})`);
        console.log(`   Admin: ${admin.name} (${admin.email})`);
        console.log('   ✅ Test users found\n');
        
        // Test message insertion
        console.log('3. Testing message creation...');
        const [result] = await connection.execute(
            'INSERT INTO messages (sender_id, receiver_id, subject, message) VALUES (?, ?, ?, ?)',
            [owner.id, admin.id, 'Test Message', 'This is a test message from owner to admin']
        );
        
        console.log(`   ✅ Message created with ID: ${result.insertId}\n`);
        
        // Test conversation creation
        console.log('4. Testing conversation creation...');
        await connection.execute(
            `INSERT INTO conversations (owner_id, admin_id, last_message_at) 
             VALUES (?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE last_message_at = NOW()`,
            [owner.id, admin.id]
        );
        
        console.log('   ✅ Conversation created/updated\n');
        
        // Test message retrieval
        console.log('5. Testing message retrieval...');
        const [messages] = await connection.execute(`
            SELECT m.*, 
                   sender.name as sender_name, 
                   receiver.name as receiver_name
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at DESC
            LIMIT 5
        `, [owner.id, admin.id, admin.id, owner.id]);
        
        console.log(`   Found ${messages.length} message(s):`);
        messages.forEach(msg => {
            console.log(`   - From ${msg.sender_name} to ${msg.receiver_name}: "${msg.message}"`);
        });
        console.log('   ✅ Message retrieval working\n');
        
        // Test conversation retrieval
        console.log('6. Testing conversation retrieval...');
        const [conversations] = await connection.execute(`
            SELECT 
                c.id as conversation_id,
                c.last_message_at,
                admin.name as admin_name,
                owner.name as owner_name
            FROM conversations c
            JOIN users admin ON c.admin_id = admin.id
            JOIN users owner ON c.owner_id = owner.id
            WHERE c.owner_id = ? OR c.admin_id = ?
        `, [owner.id, admin.id]);
        
        console.log(`   Found ${conversations.length} conversation(s):`);
        conversations.forEach(conv => {
            console.log(`   - Between ${conv.owner_name} and ${conv.admin_name}`);
        });
        console.log('   ✅ Conversation retrieval working\n');
        
        // Clean up test message
        console.log('7. Cleaning up test data...');
        await connection.execute('DELETE FROM messages WHERE id = ?', [result.insertId]);
        console.log('   ✅ Test message deleted\n');
        
        await connection.end();
        
        console.log('═══════════════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════════════');
        console.log('\nMessaging system is ready to use!');
        console.log('\nAPI Endpoints available:');
        console.log('  POST   /api/messages/send');
        console.log('  GET    /api/messages/conversation/:user_id');
        console.log('  GET    /api/messages/conversations');
        console.log('  GET    /api/messages/unread-count');
        console.log('  GET    /api/messages/admins');
        console.log('  PUT    /api/messages/read/:message_id');
        console.log('  DELETE /api/messages/:message_id');
        console.log('\nChatbox UI has been added to:');
        console.log('  - Owner dashboard (registerVehicle.html)');
        console.log('  - Admin dashboard (dashboard.html)');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testMessaging();
