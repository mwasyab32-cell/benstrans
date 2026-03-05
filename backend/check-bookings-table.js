const { createConnection } = require('./config/db');

async function checkBookingsTable() {
    try {
        const connection = await createConnection();
        
        console.log('Checking bookings table structure...\n');
        
        // Check if user_id column exists
        const [columns] = await connection.execute('DESCRIBE bookings');
        
        console.log('Current columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
        });
        
        const hasUserId = columns.some(col => col.Field === 'user_id');
        
        if (!hasUserId) {
            console.log('\n⚠️  Missing user_id column! Adding it now...');
            await connection.execute('ALTER TABLE bookings ADD COLUMN user_id INT NULL AFTER id');
            console.log('✅ user_id column added');
        } else {
            console.log('\n✅ user_id column exists');
        }
        
        // Check if id_number column exists in users table
        const [userColumns] = await connection.execute('DESCRIBE users');
        const hasIdNumber = userColumns.some(col => col.Field === 'id_number');
        
        if (!hasIdNumber) {
            console.log('\n⚠️  Missing id_number column in users table! Adding it now...');
            await connection.execute('ALTER TABLE users ADD COLUMN id_number VARCHAR(20) NULL');
            console.log('✅ id_number column added to users table');
        } else {
            console.log('✅ id_number column exists in users table');
        }
        
        await connection.end();
        console.log('\n✅ Database check complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkBookingsTable();
