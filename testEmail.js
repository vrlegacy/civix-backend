// testEmail.js (place in project root)
require('dotenv').config(); // load .env
const { sendResetEmail } = require('./utils/sendEmail');

(async () => {
  try {
    await sendResetEmail(
      'vrlegacy.care@gmail.com',
      'Test User',
      'dummy-token-1234'
    );
    console.log('✅ Test email sent!');
  } catch (err) {
    console.error('❌ Email failed:', err);
  }
})();
