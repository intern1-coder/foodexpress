const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const SALT_ROUNDS = 12;

const users = [
  { email: 'john.doe@email.com', password: 'Customer123!' },
  { email: 'jane.smith@email.com', password: 'Customer123!' },
  { email: 'bob.j@email.com', password: 'Customer123!' },
  { email: 'admin@foodexpress.com', password: 'Admin123!' },
  { email: 'mike.w@email.com', password: 'Delivery123!' },
  { email: 'sarah.b@email.com', password: 'Delivery123!' },
];

(async () => {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    database: process.env.POSTGRES_DB || 'foodexpress',
    user: process.env.POSTGRES_USER || 'foodexpress_admin',
    password: process.env.POSTGRES_PASSWORD || 'your_secure_password_here',
  });

  for (const { email, password } of users) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hash, email]
    );
    console.log(`Updated ${email} (${result.rowCount} row) — hash: ${hash.substring(0, 20)}...`);

    const verify = await bcrypt.compare(password, hash);
    console.log(`  verify: bcrypt.compare("${password}", newHash) = ${verify}`);
  }

  await pool.end();
  console.log('Done.');
})();
