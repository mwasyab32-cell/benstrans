const { createConnection } = require('./config/db');

async function testContactForm() {
    try {
        const connection = await createConnection();
        
        // Check if contacts table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'contacts'"
        );
        
        if (tables.length === 0) {
            console.log('❌ Contacts table does not exist');
            console.log('Creating contacts table...');
            
            await connection.execute(`
                CREATE TABLE contacts (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    subject VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    status ENUM('new', 'read', 'responded') DEFAULT 'new',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Contacts table created successfully');
        } else {
            console.log('✅ Contacts table exists');
        }
        
        // Check table structure
        const [columns] = await connection.execute(
            "DESCRIBE contacts"
        );
        
        console.log('\n📋 Table Structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
        });
        
        // Test insert
        console.log('\n🧪 Testing contact form submission...');
        const [result] = await connection.execute(
            'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            ['Test User', 'test@example.com', '+254700000000', 'general', 'This is a test message']
        );
        
        console.log(`✅ Test message inserted with ID: ${result.insertId}`);
        
        // Retrieve the test message
        const [messages] = await connection.execute(
            'SELECT * FROM contacts WHERE id = ?',
            [result.insertId]
        );
        
        console.log('\n📧 Retrieved Message:');
        console.log(messages[0]);
        
        // Clean up test data
        await connection.execute('DELETE FROM contacts WHERE id = ?', [result.insertId]);
        console.log('\n🧹 Test data cleaned up');
        
        await connection.end();
        console.log('\n✅ Contact form is ready to use!');
        console.log('\n📝 Instructions:');
        console.log('1. Make sure your backend server is running: node server.js');
        console.log('2. Open contact.html in your browser');
        console.log('3. Fill out and submit the contact form');
        console.log('4. Messages will be saved to the database');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testContactForm();
