const mysql = require('mysql2/promise');

// Support both DATABASE_URL and individual config variables
const getDatabaseConfig = () => {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1),
            ssl: { rejectUnauthorized: false }
        };
    }

    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'defaultdb',
        // SSL required for Aiven cloud database
        ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com')
            ? { rejectUnauthorized: false }
            : false
    };
};

const dbConfig = getDatabaseConfig();

const createConnection = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Database connected successfully ✅');
        return connection;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
};

module.exports = { createConnection, dbConfig };
