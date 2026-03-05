const { createConnection } = require('./config/db');

async function addReplyColumn() {
    try {
        const connection = await createConnection();
        
        console.log('Adding reply columns to contacts table...');
        
        // Check if columns already exist
        const [columns] = await connection.execute(
            "SHOW COLUMNS FROM contacts LIKE 'admin_reply'"
        );
        
        if (columns.length === 0) {
            await connection.execute(`
                ALTER TABLE contacts 
                ADD COLUMN admin_reply TEXT,
                ADD COLUMN replied_at TIMESTAMP NULL,
                ADD COLUMN replied_by INT
            `);
            console.log('✅ Reply columns added successfully');
        } else {
            console.log('✅ Reply columns already exist');
        }
        
        await connection.end();
        console.log('\n✅ Database updated successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addReplyColumn();
