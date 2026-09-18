const bcrypt = require('bcrypt');

const passwords = {
  'john.doe@email.com': 'Customer123!',
  'jane.smith@email.com': 'Customer123!',
  'bob.j@email.com': 'Customer123!',
  'admin@foodexpress.com': 'Admin123!',
  'mike.w@email.com': 'Delivery123!',
  'sarah.b@email.com': 'Delivery123!'
};

const updates = [];
for (const [email, pwd] of Object.entries(passwords)) {
  const hash = bcrypt.hashSync(pwd, 12);
  updates.push(`UPDATE users SET password_hash = '${hash}' WHERE email = '${email}';`);
}

require('fs').writeFileSync('reset_passwords.sql', updates.join('\n'));
console.log('Generated reset_passwords.sql');