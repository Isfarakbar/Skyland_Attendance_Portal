const fs = require('fs');

// Simple SQLite3 schema reader
const buf = fs.readFileSync('C:\\Program Files\\SmartPSSLite\\Default\\AccessControl.db');
const text = buf.toString('latin1');
const matches = text.match(/CREATE TABLE [^\(]+/g) || [];
console.log('Tables in AccessControl.db:', matches.map(m => m.trim()));
