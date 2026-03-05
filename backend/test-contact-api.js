const fetch = require('node-fetch');

async function testContactAPI() {
    const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+254700123456',
        subject: 'general',
        message: 'This is a test message from the API test'
    };

    try {
        console.log('🧪 Testing Contact API...\n');
        console.log('Sending data:', testData);
        
        const response = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        console.log('\n📡 Response Status:', response.status);
        console.log('📦 Response Data:', result);
        
        if (response.ok) {
            console.log('\n✅ Contact form API is working!');
            console.log(`Message saved with ID: ${result.contactId}`);
        } else {
            console.log('\n❌ API Error:', result.error);
        }
        
    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log('1. Backend server is running (node server.js)');
        console.log('2. Database is connected');
        console.log('3. Contacts table exists');
    }
}

testContactAPI();
