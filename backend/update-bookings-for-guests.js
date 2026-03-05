const { createConnection } = require('./config/db');

async function updateBookingsTable() {
    console.log('Updating bookings table for guest bookings...\n');
    
    try {
        const connection = await createConnection();
        
        // Add customer fields for guest bookings
        console.log('Adding customer fields...');
        
        const alterQueries = [
            `ALTER TABLE bookings 
             ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) NULL AFTER client_id`,
            
            `ALTER TABLE bookings 
             ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) NULL AFTER customer_name`,
            
            `ALTER TABLE bookings 
             ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) NULL AFTER customer_email`,
            
            `ALTER TABLE bookings 
             ADD COLUMN IF NOT EXISTS customer_id_number VARCHAR(50) NULL AFTER customer_phone`,
            
            `ALTER TABLE bookings 
             ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50) NULL AFTER customer_id_number`,
            
            `ALTER TABLE bookings 
             MODIFY COLUMN client_id INT NULL`
        ];
        
        for (const query of alterQueries) {
            try {
                await connection.execute(query);
                console.log('✅ Column added/modified');
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  Column already exists, skipping');
                } else {
                    console.log('⚠️  Error:', error.message);
                }
            }
        }
        
        // Add index on reference_number
        try {
            await connection.execute('CREATE INDEX idx_reference_number ON bookings(reference_number)');
            console.log('✅ Index created on reference_number');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index already exists');
            }
        }
        
        await connection.end();
        
        console.log('\n✅ Bookings table updated successfully!');
        console.log('\nNew features:');
        console.log('  - Guest bookings without registration');
        console.log('  - Customer details stored directly');
        console.log('  - Reference number for tracking');
        
    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
}

updateBookingsTable();
