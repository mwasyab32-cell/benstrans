const { createConnection } = require('./config/db');

async function fixBookingsTable() {
    console.log('Fixing bookings table for guest bookings...\n');
    
    try {
        const connection = await createConnection();
        
        // Check current table structure
        console.log('Checking current table structure...');
        const [columns] = await connection.execute('DESCRIBE bookings');
        const existingColumns = columns.map(col => col.Field);
        console.log('Existing columns:', existingColumns.join(', '));
        
        // Add missing columns one by one
        const columnsToAdd = [
            { name: 'customer_name', sql: 'ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(255) NULL' },
            { name: 'customer_email', sql: 'ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(255) NULL' },
            { name: 'customer_phone', sql: 'ALTER TABLE bookings ADD COLUMN customer_phone VARCHAR(20) NULL' },
            { name: 'customer_id_number', sql: 'ALTER TABLE bookings ADD COLUMN customer_id_number VARCHAR(50) NULL' },
            { name: 'reference_number', sql: 'ALTER TABLE bookings ADD COLUMN reference_number VARCHAR(50) NULL' }
        ];
        
        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                try {
                    console.log(`Adding column: ${col.name}...`);
                    await connection.execute(col.sql);
                    console.log(`✅ ${col.name} added`);
                } catch (error) {
                    console.log(`❌ Error adding ${col.name}:`, error.message);
                }
            } else {
                console.log(`⚠️  ${col.name} already exists`);
            }
        }
        
        // Make client_id nullable
        try {
            console.log('\nMaking client_id nullable...');
            await connection.execute('ALTER TABLE bookings MODIFY COLUMN client_id INT NULL');
            console.log('✅ client_id is now nullable');
        } catch (error) {
            console.log('⚠️  Error:', error.message);
        }
        
        // Add index on reference_number if not exists
        try {
            console.log('\nAdding index on reference_number...');
            await connection.execute('CREATE INDEX idx_reference_number ON bookings(reference_number)');
            console.log('✅ Index created');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index already exists');
            } else {
                console.log('⚠️  Error:', error.message);
            }
        }
        
        // Verify final structure
        console.log('\nFinal table structure:');
        const [finalColumns] = await connection.execute('DESCRIBE bookings');
        finalColumns.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        await connection.end();
        
        console.log('\n✅ Bookings table is ready for guest bookings!');
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
        process.exit(1);
    }
}

fixBookingsTable();
