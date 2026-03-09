const mysql = require('mysql2/promise');

// Support both individual config and DATABASE_URL (for deployment platforms)
const getDatabaseConfig = () => {
    // If DATABASE_URL is provided (common in cloud platforms)
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            port: url.port || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1) // Remove leading slash
        };
    }
    
    // Otherwise use individual environment variables or defaults
    return {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '@mwasya99',
        database: process.env.DB_NAME || 'bensdb'
    };
};

const dbConfig = getDatabaseConfig();

const createConnection = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Database connected successfully');
        return connection;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

module.exports = { createConnection, dbConfig };