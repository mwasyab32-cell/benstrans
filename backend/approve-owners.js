const { createConnection } = require('./config/db');

async function approvePendingOwners() {
    try {
        console.log('🔧 Approving all pending owners...');
        
        const connection = await createConnection();
        
        // Get pending owners
        const [pendingOwners] = await connection.execute(
            'SELECT id, name, email FROM users WHERE role = "owner" AND status = "pending"'
        );
        
        if (pendingOwners.length === 0) {
            console.log('✅ No pending owners found');
            await connection.end();
            return;
        }
        
        console.log(`📋 Found ${pendingOwners.length} pending owners:`);
        pendingOwners.forEach(owner => {
            console.log(`   - ${owner.name} (${owner.email})`);
        });
        
        // Approve all pending owners
        const [result] = await connection.execute(
            'UPDATE users SET status = "approved" WHERE role = "owner" AND status = "pending"'
        );
        
        console.log(`✅ Approved ${result.affectedRows} owners`);
        
        await connection.end();
        console.log('🎉 All pending owners have been approved!');
        
    } catch (error) {
        console.error('❌ Error approving owners:', error.message);
    }
}

approvePendingOwners();