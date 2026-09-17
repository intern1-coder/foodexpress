const bcrypt = require('bcrypt');
const { query } = require('./src/config/database');

(async () => {
  const r = await query('SELECT password_hash FROM users WHERE email = $1', ['admin@foodexpress.com']);
  const hash = r.rows[0].password_hash;
  console.log('Hash length:', hash.length);
  console.log('Hash:', hash);
  const ok = await bcrypt.compare('Admin123!', hash);
  console.log('Match:', ok);
  process.exit(0);
})();
