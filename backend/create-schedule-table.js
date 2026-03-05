const { createConnection } = require('./config/db');

async function createScheduleTable() {
    try {
        const connection = await createConnection();
        
        console.log('Creating vehicle_schedules table...');
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS vehicle_schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                departure_time TIME NOT NULL,
                day_of_week VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                UNIQUE KEY unique_schedule (vehicle_id, departure_time, day_of_week)
            )
        `);
        
        console.log('✓ vehicle_schedules table created successfully');
        
        await connection.end();
        console.log('Database setup completed!');
        
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

createScheduleTable();