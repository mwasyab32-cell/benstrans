const { createConnection } = require('./config/db');

async function checkDatabase() {
    try {
        const connection = await createConnection();
        
        // Check all users
        const [users] = await connection.execute('SELECT id, name, email, role, status FROM users ORDER BY id');
        console.log('All users in database:');
        users.forEach(user => {
            console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
        });
        
        // Check vehicles
        const [vehicles] = await connection.execute('SELECT * FROM vehicles');
        console.log('\nVehicles:', vehicles.length);
        
        // Check contacts
        const [contacts] = await connection.execute('SELECT * FROM contacts');
        console.log('Contacts:', contacts.length);
        
        await connection.end();
    } catch (error) {
        console.error('Database check error:', error);
    }
}

checkDatabase();