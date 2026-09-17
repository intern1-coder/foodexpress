const bcrypt = require('bcrypt');
const { query } = require('./src/config/database');

(async () => {
  const passwords = {
    'john.doe@email.com': 'Customer123!',
    'jane.smith@email.com': 'Customer123!',
    'bob.j@email.com': 'Customer123!',
    'admin@foodexpress.com': 'Admin123!',
    'mike.w@email.com': 'Delivery123!',
    'sarah.b@email.com': 'Delivery123!'
  };
  for (const [email, pass] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(pass, 12);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
    console.log('Updated:', email);
  }
  process.exit(0);
})();
