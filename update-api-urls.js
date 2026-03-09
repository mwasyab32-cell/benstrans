const fs = require('fs');
const path = require('path');

// Your production URL - UPDATE THIS!
const PRODUCTION_URL = 'https://your-domain.com'; // e.g., https://benstrans-booking.onrender.com

const LOCAL_API = 'http://localhost:3000/api';
const PRODUCTION_API = `${PRODUCTION_URL}/api`;

console.log('🔄 Updating API URLs for production...\n');
console.log(`From: ${LOCAL_API}`);
console.log(`To: ${PRODUCTION_API}\n`);

// Files to update
const filesToUpdate = [
    'frontend/js/auth.js',
    'frontend/js/booking.js',
    'frontend/js/vehicles.js',
    'frontend/js/admin-dashboard.js',
    'frontend/js/chatbox.js',
    'frontend/admin/dashboard.html',
    'frontend/admin/bookings.html',
    'frontend/admin/messages.html',
    'frontend/admin/chat.html',
    'frontend/admin/approve.html',
    'frontend/admin/sms-reports.html',
    'frontend/client/dashboard.html',
    'frontend/check-messages.html',
    'frontend/owner/registerVehicle.html',
    'frontend/owner/manageVehicles.html'
];

let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    
    try {
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replace localhost API URLs
            const originalContent = content;
            content = content.replace(/http:\/\/localhost:3000\/api/g, PRODUCTION_API);
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`✅ Updated: ${filePath}`);
                updatedCount++;
            } else {
                console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
            }
        } else {
            console.log(`⚠️  Not found: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        errorCount++;
    }
});

console.log('\n' + '='.repeat(50));
console.log(`✅ Updated: ${updatedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);
console.log('='.repeat(50));

if (updatedCount > 0) {
    console.log('\n🎉 API URLs updated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test your application locally');
    console.log('2. Commit changes: git add . && git commit -m "Update API URLs for production"');
    console.log('3. Push to your repository: git push');
    console.log('4. Deploy to your hosting platform');
} else {
    console.log('\n⚠️  No files were updated. Check if PRODUCTION_URL is set correctly.');
}
