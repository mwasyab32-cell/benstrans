const { createConnection } = require('../config/db');

// Handle SMS delivery reports from Africa's Talking
const handleDeliveryReport = async (req, res) => {
    try {
        console.log('\n========================================');
        console.log('📬 SMS DELIVERY REPORT RECEIVED');
        console.log('========================================');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('========================================\n');
        
        // Africa's Talking sends delivery reports with these fields:
        // - id: Message ID
        // - status: Delivery status (Success, Failed, etc.)
        // - phoneNumber: Recipient phone number
        // - networkCode: Mobile network code
        // - retryCount: Number of retry attempts
        // - failureReason: Reason for failure (if failed)
        
        const {
            id: messageId,
            status,
            phoneNumber,
            networkCode,
            retryCount,
            failureReason
        } = req.body;
        
        if (!messageId) {
            console.log('⚠️  No message ID provided in delivery report');
            return res.status(400).json({ error: 'Message ID is required' });
        }
        
        const connection = await createConnection();
        
        // Update SMS log with delivery status
        const deliveryStatus = status || 'unknown';
        const updateQuery = `
            UPDATE sms_logs 
            SET delivery_status = ?,
                network = ?,
                failure_reason = ?,
                delivered_at = NOW(),
                updated_at = NOW()
            WHERE message_id = ?
        `;
        
        await connection.execute(updateQuery, [
            deliveryStatus,
            networkCode || null,
            failureReason || null,
            messageId
        ]);
        
        console.log(`✅ Updated delivery status for message ${messageId}: ${deliveryStatus}`);
        
        if (failureReason) {
            console.log(`❌ Failure reason: ${failureReason}`);
        }
        
        await connection.end();
        
        // Africa's Talking expects a 200 OK response
        res.status(200).json({ 
            success: true,
            message: 'Delivery report received'
        });
        
    } catch (error) {
        console.error('❌ Error processing delivery report:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get SMS delivery statistics
const getSMSStats = async (req, res) => {
    try {
        const connection = await createConnection();
        
        // Get overall statistics
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_sent,
                SUM(CASE WHEN delivery_status = 'Success' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN delivery_status = 'Failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN delivery_status IS NULL OR delivery_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CAST(REPLACE(REPLACE(cost, 'KES ', ''), 'KSh ', '') AS DECIMAL(10,2))) as total_cost
            FROM sms_logs
        `);
        
        // Get recent SMS logs
        const [recentLogs] = await connection.execute(`
            SELECT 
                id,
                phone_number,
                LEFT(message, 50) as message_preview,
                status,
                delivery_status,
                cost,
                network,
                failure_reason,
                sent_at,
                delivered_at
            FROM sms_logs
            ORDER BY sent_at DESC
            LIMIT 50
        `);
        
        await connection.end();
        
        res.json({
            statistics: stats[0],
            recent_logs: recentLogs
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get SMS logs for a specific phone number
const getSMSLogsByPhone = async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const connection = await createConnection();
        
        const [logs] = await connection.execute(
            `SELECT * FROM sms_logs WHERE phone_number = ? ORDER BY sent_at DESC`,
            [phoneNumber]
        );
        
        await connection.end();
        res.json(logs);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    handleDeliveryReport,
    getSMSStats,
    getSMSLogsByPhone
};
