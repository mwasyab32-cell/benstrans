const { createConnection } = require('./config/db');

async function checkOwners() {
    try {
        const connection = await createConnection();
        
        const [owners] = await connection.execute('SELECT id, name, email, status FROM users WHERE role = "owner"');
        
        console.log('Owners:');
        owners.forEach(owner => {
            console.log(`ID: ${owner.id}, Name: ${owner.name}, Email: ${owner.email}, Status: ${owner.status}`);
        });
        
        // Auto-approve pending owners for testing
        const [pending] = await connection.execute('SELECT id FROM users WHERE role = "owner" AND status = "pending"');
        
        if (pending.length > 0) {
            await connection.execute('UPDATE users SET status = "approved" WHERE role = "owner" AND status = "pending"');
            console.log(`Approved ${pending.length} pending owners`);
        }
        
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOwners();