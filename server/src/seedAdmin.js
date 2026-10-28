import { connectDB, disconnectDB } from './config/db.js';
import User from './models/User.js';
import { hashPassword } from './utils/crypto.js';

async function seedAdmin() {
  console.log('Connecting to database...');
  await connectDB();

  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.argv[2] || process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('\n❌ Missing required admin credentials!');
    console.error('Please specify both DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD via environment variables, or pass the password as a CLI argument:');
    console.error('  DEFAULT_ADMIN_EMAIL=admin@example.com DEFAULT_ADMIN_PASSWORD=your_secure_password node src/seedAdmin.js');
    console.error('  node src/seedAdmin.js <password>\n');
    await disconnectDB();
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);

  let user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (user) {
    user.password = hashedPassword;
    user.role = 'admin';
    user.status = 'active';
    await user.save();
    console.log('\n==========================================');
    console.log('✅ Admin credentials updated successfully!');
  } else {
    user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      telegramChatId: '',
    });
    console.log('\n==========================================');
    console.log('✅ Master Admin account created successfully!');
  }

  console.log('------------------------------------------');
  console.log(`👤 Username: ${username}`);
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: [CONFIGURED - HIDDEN FOR SECURITY]`);
  console.log('------------------------------------------');
  console.log('🌐 Login at: http://localhost:5173/login');
  console.log('==========================================\n');

  await disconnectDB();
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('❌ Failed to seed admin user:', err.message);
  process.exit(1);
});
