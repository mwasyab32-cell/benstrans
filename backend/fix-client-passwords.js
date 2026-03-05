// Fix existing client passwords to use ID numbers
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createConnection } = require('./config/db');

async function fixClientPasswords() {
    console.log('=== Fixing Client Passwords ===\n');
    
    const connection = await createConnection();
    
    try {
        // Get all clients with ID numbers
        const [clients] = await connection.execute(`
            SELECT id, name, email, id_number 
            FROM users 
            WHERE role = 'client' 
            AND id_number IS NOT NULL 
            AND id_number != ''
        `);
        
        if (clients.length === 0) {
            console.log('No clients with ID numbers found.');
            await connection.end();
            return;
        }
        
        console.log(`Found ${clients.length} client(s) to update:\n`);
        
        let updated = 0;
        
        for (const client of clients) {
            console.log(`Updating ${client.name} (${client.email})...`);
            console.log(`  ID Number: ${client.id_number}`);
            
            // Hash the ID number
            const hashedPassword = await bcrypt.hash(client.id_number, 10);
            
            // Update the password
            await connection.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, client.id]
            );
            
            console.log(`  ✅ Password updated to ID number\n`);
            updated++;
        }
        
        console.log(`\n=== Update Complete ===`);
        console.log(`✅ Updated ${updated} client password(s)\n`);
        console.log('Clients can now login with:');
        console.log('  Email: Their booking email');
        console.log('  Password: Their 8-digit ID number\n');
        
        // Show test credentials
        if (clients.length > 0) {
            console.log('Test with:');
            console.log(`  Email: ${clients[0].email}`);
            console.log(`  Password: ${clients[0].id_number}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

fixClientPasswords();
