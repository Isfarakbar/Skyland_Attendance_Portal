const fs = require('fs');

const buf = fs.readFileSync('C:\\Program Files\\SmartPSSLite\\Default\\AccessControl.db');
const header = buf.slice(0, 16).toString('utf8');
console.log('AccessControl.db header:', header);
