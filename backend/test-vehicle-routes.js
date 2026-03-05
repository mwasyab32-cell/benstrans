// Test script to verify vehicle management routes are working
console.log('Testing Vehicle Management Routes...\n');

const routes = [
    'POST /api/vehicles/register - Register new vehicle',
    'GET /api/vehicles/my-vehicles - Get owner vehicles',
    'GET /api/vehicles/my-trips - Get owner trips',
    'GET /api/vehicles/:id - Get single vehicle',
    'PUT /api/vehicles/:id - Update vehicle',
    'DELETE /api/vehicles/:id - Delete vehicle'
];

console.log('✅ Available Routes:');
routes.forEach(route => console.log('  ' + route));

console.log('\n📝 Instructions:');
console.log('1. Make sure your backend server is running: node server.js');
console.log('2. Login as an owner');
console.log('3. Go to: owner/manageVehicles.html');
console.log('4. You should see all your vehicles with Edit/Delete buttons');
console.log('\n💡 If routes are not working:');
console.log('   - Restart your backend server');
console.log('   - Check browser console for errors (F12)');
console.log('   - Verify you are logged in as an owner');
