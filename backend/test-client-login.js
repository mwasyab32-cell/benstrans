// Test client login functionality
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createConnection } = require('./config/db');

async function testClientLogin() {
    console.log('=== Testing Client Login System ===\n');
    
    const connection = await createConnection();
    
    try {
        // 1. Check if users table has id_number column
        console.log('1. Checking users table structure...');
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM users
        `);
        
        console.log('Users table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });
        
        const hasIdNumber = columns.some(col => col.Field === 'id_number');
        if (!hasIdNumber) {
            console.log('\n❌ ERROR: id_number column is missing from users table!');
            console.log('Run this SQL to add it:');
            console.log('ALTER TABLE users ADD COLUMN id_number VARCHAR(20) AFTER phone;');
            await connection.end();
            return;
        }
        console.log('✅ id_number column exists\n');
        
        // 2. Check recent client accounts
        console.log('2. Checking recent client accounts...');
        const [clients] = await connection.execute(`
            SELECT id, name, email, phone, id_number, role, status, created_at 
            FROM users 
            WHERE role = 'client' 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        if (clients.length === 0) {
            console.log('❌ No client accounts found. Make a booking first.\n');
            await connection.end();
            return;
        }
        
        console.log(`Found ${clients.length} client account(s):\n`);
        clients.forEach((client, index) => {
            console.log(`Client ${index + 1}:`);
            console.log(`  Name: ${client.name}`);
            console.log(`  Email: ${client.email}`);
            console.log(`  Phone: ${client.phone}`);
            console.log(`  ID Number: ${client.id_number || 'NOT SET'}`);
            console.log(`  Status: ${client.status}`);
            console.log(`  Created: ${client.created_at}`);
            console.log('');
        });
        
        // 3. Test login with first client
        if (clients.length > 0 && clients[0].id_number) {
            const testClient = clients[0];
            console.log('3. Testing login...');
            console.log(`Email: ${testClient.email}`);
            console.log(`ID Number: ${testClient.id_number}`);
            
            // Get the hashed password
            const [userWithPassword] = await connection.execute(
                'SELECT password FROM users WHERE id = ?',
                [testClient.id]
            );
            
            if (userWithPassword.length > 0) {
                const hashedPassword = userWithPassword[0].password;
                
                // Test if ID number matches the password
                const isMatch = await bcrypt.compare(testClient.id_number, hashedPassword);
                
                if (isMatch) {
                    console.log('✅ Password matches ID number - Login should work!\n');
                } else {
                    console.log('❌ Password does NOT match ID number\n');
                    console.log('This account was created before the ID number password update.');
                    console.log('To fix, run this SQL:');
                    console.log(`UPDATE users SET password = '${await bcrypt.hash(testClient.id_number, 10)}' WHERE id = ${testClient.id};`);
                }
            }
        }
        
        // 4. Check for accounts without id_number
        const [noIdNumber] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE role = 'client' AND (id_number IS NULL OR id_number = '')
        `);
        
        if (noIdNumber[0].count > 0) {
            console.log(`⚠️  Warning: ${noIdNumber[0].count} client account(s) without ID number`);
            console.log('These accounts were created before the ID number requirement.\n');
        }
        
        console.log('=== Test Complete ===\n');
        console.log('To test login:');
        console.log('1. Go to login.html');
        console.log(`2. Email: ${clients[0].email}`);
        console.log(`3. Password: ${clients[0].id_number}`);
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await connection.end();
    }
}

testClientLogin();
