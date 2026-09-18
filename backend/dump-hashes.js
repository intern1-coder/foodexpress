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
  for (const { email, password } of users) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log(`${email} => ${hash}`);
  }
})();
