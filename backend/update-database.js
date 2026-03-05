const { createConnection } = require('./config/db');

async function updateDatabase() {
    try {
        const connection = await createConnection();
        
        console.log('Updating database schema...');
        
        // Add vehicle_type column if it doesn't exist
        try {
            await connection.execute(`
                ALTER TABLE vehicles 
                ADD COLUMN vehicle_type ENUM('bus', 'shuttle') NOT NULL DEFAULT 'bus' AFTER vehicle_number
            `);
            console.log('✓ Added vehicle_type column');
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.log('vehicle_type column already exists');
            }
        }
        
        // Add registration_fee column if it doesn't exist
        try {
            await connection.execute(`
                ALTER TABLE vehicles 
                ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0 AFTER price
            `);
            console.log('✓ Added registration_fee column');
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.log('registration_fee column already exists');
            }
        }
        
        // Update status enum to include 'rejected'
        try {
            await connection.execute(`
                ALTER TABLE vehicles 
                MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
            `);
            console.log('✓ Updated status enum to include rejected');
        } catch (error) {
            console.log('Status enum update failed:', error.message);
        }
        
        // Update existing vehicles with default registration fees
        await connection.execute(`
            UPDATE vehicles 
            SET registration_fee = CASE 
                WHEN vehicle_type = 'bus' THEN 5000 
                WHEN vehicle_type = 'shuttle' THEN 3000 
                ELSE 3000 
            END 
            WHERE registration_fee = 0
        `);
        console.log('✓ Updated existing vehicles with registration fees');
        
        await connection.end();
        console.log('Database update completed successfully!');
        
    } catch (error) {
        console.error('Database update failed:', error);
        process.exit(1);
    }
}

updateDatabase();