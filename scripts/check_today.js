const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
env.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log('Employees in system:');
  for (const u of users) {
    console.log(`  ${u.employeeId} - ${u.name} (biometricUserId: ${u.biometricUserId})`);
  }
  const uHassan = users.find(x => x.employeeId === 'SKY-005');
  if (uHassan) {
    await mongoose.connection.collection('attendances').updateOne(
      { user: uHassan._id, date: '2026-10-16' },
      { $set: { clockOut: null, totalWorkMinutes: 0 } }
    );
    console.log('Reset accidental clockOut for Muhammad Hassan (SKY-005)');
  }
  await mongoose.disconnect();
}
check().catch(console.error);
