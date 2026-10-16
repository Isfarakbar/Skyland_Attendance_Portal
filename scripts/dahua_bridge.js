/**
 * Skyland Energy — Dahua Biometric Device Real-Time LAN Bridge (Node.js)
 * ---------------------------------------------------------------------
 * Native Node.js agent for connecting to Dahua ASA1222G biometric terminals.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'bridge_config.json');
let config = {
  portal_urls: ['http://localhost:3001', 'http://localhost:3000', 'http://192.168.100.245:3001', 'http://192.168.100.245:3000'],
  device_ip: '192.168.100.220',
  device_port: 80,
  device_user: 'admin',
  device_pass: 'admin123'
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } catch (e) {}
}

const PORTAL_URLS = process.env.SKYLAND_PORTAL_URL ? [process.env.SKYLAND_PORTAL_URL] : config.portal_urls;
const DEVICE_IP = process.env.DAHUA_DEVICE_IP || config.device_ip;
const DEVICE_PORT = parseInt(process.env.DAHUA_DEVICE_PORT || config.device_port, 10);
const DEVICE_USER = process.env.DAHUA_USER || config.device_user;
const DEVICE_PASS = process.env.DAHUA_PASS || config.device_pass;

let activePortalEndpoint = null;

console.log('==================================================================');
console.log('  SKYLAND ENERGY — DAHUA BIOMETRIC LIVE SYNC BRIDGE (NODE.JS)');
console.log('==================================================================');
console.log(`[*] Target Biometric Terminal : http://${DEVICE_IP}:${DEVICE_PORT}`);
console.log(`[*] Device Username           : ${DEVICE_USER}`);
console.log('==================================================================\n');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function makeDigestAuth(uri, method, authHeader, username, password) {
  const getVal = (key) => {
    const m = authHeader.match(new RegExp(key + '="?([^",]+)"?'));
    return m ? m[1] : '';
  };

  const realm = getVal('realm');
  const nonce = getVal('nonce');
  const qop = getVal('qop') || '';
  const opaque = getVal('opaque') || '';

  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const nc = '00000001';
  const cnonce = crypto.randomBytes(8).toString('hex');

  let response;
  if (qop.includes('auth')) {
    response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:auth:${ha2}`);
  } else {
    response = md5(`${ha1}:${nonce}:${ha2}`);
  }

  let parts = [
    `username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`
  ];
  if (qop.includes('auth')) {
    parts.push('qop=auth');
    parts.push(`nc=${nc}`);
    parts.push(`cnonce="${cnonce}"`);
  }
  if (opaque) parts.push(`opaque="${opaque}"`);
  return 'Digest ' + parts.join(', ');
}

async function findActivePortal() {
  for (const baseUrl of PORTAL_URLS) {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/attendance/device-sync`;
    try {
      const ok = await new Promise((resolve) => {
        const req = http.get(endpoint, { timeout: 3000 }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                console.log(`[✓] Connected to Attendance Portal: ${endpoint}`);
                console.log(`    Status: ${j.status || 'Online'} | Timezone: ${j.timezone || 'Asia/Karachi'}`);
                activePortalEndpoint = endpoint;
                return resolve(true);
              } catch (e) {}
            }
            resolve(false);
          });
        });
        req.on('error', () => resolve(false));
      });
      if (ok) return activePortalEndpoint;
    } catch (e) {}
  }
  activePortalEndpoint = `${PORTAL_URLS[0].replace(/\/+$/, '')}/api/attendance/device-sync`;
  return activePortalEndpoint;
}

async function pushPunchToPortal(userId, timestampIso, verifyMode = 'Fingerprint') {
  const endpoint = activePortalEndpoint || await findActivePortal();
  const timeStr = timestampIso || new Date().toISOString();

  const payload = JSON.stringify({
    punches: [{
      userId: String(userId).trim(),
      timestamp: timeStr,
      verifyMode,
      type: 'AUTO'
    }]
  });

  return new Promise((resolve) => {
    try {
      const url = new URL(endpoint);
      const req = http.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 8000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const results = data.results || [];
            for (const r of results) {
              console.log(`[✓] SYNCED TO DB: ${r.employeeName || 'Unknown'} (${r.employeeId || r.userId}) -> ${r.action} [${r.status}] at ${new Date().toLocaleTimeString()}`);
            }
            resolve(true);
          } catch (e) {
            resolve(false);
          }
        });
      });
      req.on('error', (e) => {
        console.error(`[X] Error pushing punch to portal: ${e.message}`);
        resolve(false);
      });
      req.write(payload);
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

function listenEventStream() {
  const path = '/cgi-bin/eventManager.cgi?action=attach&codes=[AccessControl]';
  console.log(`[*] Connecting to Dahua real-time event stream at http://${DEVICE_IP}:${DEVICE_PORT}${path}...`);

  const req1 = http.request({
    host: DEVICE_IP,
    port: DEVICE_PORT,
    path,
    method: 'GET'
  }, (res1) => {
    if (res1.statusCode === 401) {
      const authHeader = res1.headers['www-authenticate'];
      if (!authHeader) {
        console.error('[!] 401 received without WWW-Authenticate header');
        return setTimeout(listenEventStream, 5000);
      }
      const authVal = makeDigestAuth(path, 'GET', authHeader, DEVICE_USER, DEVICE_PASS);

      const req2 = http.request({
        host: DEVICE_IP,
        port: DEVICE_PORT,
        path,
        method: 'GET',
        headers: { 'Authorization': authVal }
      }, (res2) => {
        if (res2.statusCode === 200) {
          console.log('[✓] Live Dahua Event Stream CONNECTED! Listening for physical fingerprint swipes...\n');
          let buffer = '';
          res2.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split(/\r?\n\r?\n/);
            buffer = lines.pop() || '';

            for (const block of lines) {
              if (block.includes('Code=AccessControl')) {
                const userMatch = block.match(/UserID="?(\d+)"?/) || block.match(/CardNo="?(\d+)"?/);
                const timeMatch = block.match(/CreateTime=(\d+)/);
                if (userMatch) {
                  const uid = userMatch[1];
                  const punchTime = timeMatch ? new Date(parseInt(timeMatch[1], 10) * 1000).toISOString() : new Date().toISOString();
                  console.log(`\n[⚡] FINGERPRINT SWIPE DETECTED: User #${uid} at ${punchTime}`);
                  pushPunchToPortal(uid, punchTime, 'Fingerprint');
                }
              }
            }
          });
          res2.on('end', () => {
            console.log('[!] Event stream closed by device. Reconnecting in 5s...');
            setTimeout(listenEventStream, 5000);
          });
        } else if (res2.statusCode === 403) {
          console.log('[!] Dahua device is locked out (error 403). Waiting 60s before retry...');
          setTimeout(listenEventStream, 60000);
        } else {
          console.log(`[!] Dahua returned status ${res2.statusCode}. Retrying in 10s...`);
          setTimeout(listenEventStream, 10000);
        }
      });
      req2.on('error', (e) => {
        console.log(`[!] Error connecting: ${e.message}. Retrying in 5s...`);
        setTimeout(listenEventStream, 5000);
      });
      req2.end();
    } else if (res1.statusCode === 200) {
      console.log('[✓] Live event stream connected without authentication!');
    }
  });

  req1.on('error', (e) => {
    console.log(`[!] Cannot reach Dahua terminal at ${DEVICE_IP}:${DEVICE_PORT} (${e.message}). Retrying in 5s...`);
    setTimeout(listenEventStream, 5000);
  });
  req1.end();
}

async function main() {
  await findActivePortal();

  // Test mode: node dahua_bridge.js --test <id>
  if (process.argv.includes('--test')) {
    const idx = process.argv.indexOf('--test');
    const testId = process.argv[idx + 1] || '1';
    console.log(`[*] Sending test verification punch for User #${testId}...`);
    await pushPunchToPortal(testId);
    process.exit(0);
  }

  listenEventStream();
}

main();
