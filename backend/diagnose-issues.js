const { createConnection } = require('./config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth.middleware');

async function diagnoseIssues() {
    console.log('🔍 Diagnosing Vehicle Registration Issues...\n');
    
    // 1. Test Database Connection
    console.log('1. Testing Database Connection...');
    try {
        const connection = await createConnection();
        console.log('✅ Database connection successful');
        
        // Check if tables exist
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
        
        // Check users table
        const [users] = await connection.execute('SELECT id, name, email, role, status FROM users WHERE role = "owner" LIMIT 5');
        console.log('👥 Sample owners:', users);
        
        // Check vehicles table
        const [vehicles] = await connection.execute('SELECT COUNT(*) as count FROM vehicles');
        console.log('🚗 Total vehicles:', vehicles[0].count);
        
        await connection.end();
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return;
    }
    
    // 2. Test JWT Token Generation
    console.log('\n2. Testing JWT Token Generation...');
    try {
        const testUser = { id: 1, email: 'test@owner.com', role: 'owner' };
        const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ JWT token generated successfully');
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ JWT token verification successful:', decoded);
    } catch (error) {
        console.log('❌ JWT token issue:', error.message);
    }
    
    // 3. Check for common issues
    console.log('\n3. Checking for Common Issues...');
    
    try {
        const connection = await createConnection();
        
        // Check for pending owners
        const [pendingOwners] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "owner" AND status = "pending"');
        console.log(`⏳ Pending owners: ${pendingOwners[0].count}`);
        
        // Check for approved owners
        const [approvedOwners] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "owner" AND status = "approved"');
        console.log(`✅ Approved owners: ${approvedOwners[0].count}`);
        
        // Check vehicle registration constraints
        const [vehicleConstraints] = await connection.execute(`
            SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'bensdb' AND TABLE_NAME = 'vehicles'
        `);
        console.log('🔧 Vehicle table structure:');
        vehicleConstraints.forEach(col => {
            console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
        });
        
        await connection.end();
    } catch (error) {
        console.log('❌ Error checking database structure:', error.message);
    }
    
    console.log('\n🎯 Diagnosis Complete!');
    console.log('\n📋 Common Solutions:');
    console.log('1. Ensure MySQL server is running');
    console.log('2. Check database credentials in config/db.js');
    console.log('3. Verify owner accounts are approved by admin');
    console.log('4. Check browser console for JavaScript errors');
    console.log('5. Ensure server is running on http://localhost:3000');
}

// Run diagnosis
diagnoseIssues().catch(console.error);