const fs = require('fs');
const path = require('path');
const { createConnection } = require('./config/db');

async function initializeDatabase() {
    console.log('🔧 Initializing database...\n');
    
    try {
        const connection = await createConnection();
        
        // Read schema files
        const schemaFiles = [
            '../database/schema.sql',
            '../database/messaging-schema.sql',
            '../database/payment-schema.sql',
            '../database/sms-delivery-schema.sql'
        ];
        
        for (const file of schemaFiles) {
            const filePath = path.join(__dirname, file);
            
            if (fs.existsSync(filePath)) {
                console.log(`📄 Processing: ${file}`);
                const sql = fs.readFileSync(filePath, 'utf8');
                
                // Split by semicolon and execute each statement
                const statements = sql
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
                
                for (const statement of statements) {
                    try {
                        await connection.execute(statement);
                    } catch (err) {
                        // Ignore "table already exists" errors
                        if (!err.message.includes('already exists')) {
                            console.error(`   ⚠️  Error: ${err.message}`);
                        }
                    }
                }
                
                console.log(`   ✅ Completed: ${file}\n`);
            } else {
                console.log(`   ⚠️  File not found: ${file}\n`);
            }
        }
        
        // Verify tables were created
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📊 Database Tables:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   ✓ ${tableName}`);
        });
        
        console.log('\n✅ Database initialization complete!');
        
        await connection.end();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check DATABASE_URL environment variable is set');
        console.error('2. Verify database credentials are correct');
        console.error('3. Ensure database server is accessible');
        console.error('4. Check Render database status is "Available"');
        process.exit(1);
    }
}

initializeDatabase();
