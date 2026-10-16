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
  const atts = await mongoose.connection.collection('attendances').find({ date: '2026-10-16' }).toArray();
  console.log('\nAttendance records for today:');
  for (const a of atts) {
    const u = users.find(x => x._id.toString() === a.user.toString());
    console.log(`  ${u ? u.name : a.user} (${u ? u.employeeId : ''}): In=${a.clockIn ? a.clockIn.toLocaleTimeString() : 'null'} Out=${a.clockOut ? a.clockOut.toLocaleTimeString() : 'null'} Status=${a.status}`);
  }
  await mongoose.disconnect();
}
check().catch(console.error);
