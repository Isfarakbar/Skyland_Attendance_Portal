"""
Skyland Energy — Dahua Biometric Device Real-Time LAN Bridge
------------------------------------------------------------
Connects directly to the Dahua ASA1222G Biometric Time Attendance Terminal
at 192.168.100.220, streams or polls real-time fingerprint punches, and
instantly synchronizes them with the Skyland Attendance Portal MongoDB.
"""

import os
import sys
import time
import json
import re
import hashlib
import urllib.request
import urllib.error
from datetime import datetime

# Ensure utf-8 on Windows command prompts
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load saved bridge config if available
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "bridge_config.json")
config = {
    "portal_urls": ["http://localhost:3001", "http://localhost:3000", "http://192.168.100.245:3001", "http://192.168.100.245:3000"],
    "device_ip": "192.168.100.220",
    "device_port": 80,
    "device_user": "admin",
    "device_pass": "admin123"
}

if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, "r") as f:
            config.update(json.load(f))
    except Exception:
        pass

PORTAL_URLS = [os.environ.get("SKYLAND_PORTAL_URL")] if os.environ.get("SKYLAND_PORTAL_URL") else config["portal_urls"]
DEVICE_IP = os.environ.get("DAHUA_DEVICE_IP", config["device_ip"])
DEVICE_PORT = int(os.environ.get("DAHUA_DEVICE_PORT", config["device_port"]))
DEVICE_USER = os.environ.get("DAHUA_USER", config["device_user"])
DEVICE_PASS = os.environ.get("DAHUA_PASS", config["device_pass"])

active_portal_endpoint = None

print("==================================================================")
print("  SKYLAND ENERGY - DAHUA BIOMETRIC LIVE SYNC BRIDGE")
print("==================================================================")
print(f"[*] Target Biometric Terminal : http://{DEVICE_IP}:{DEVICE_PORT}")
print(f"[*] User                      : {DEVICE_USER}")
print("==================================================================\n")

def find_active_portal():
    global active_portal_endpoint
    for base_url in PORTAL_URLS:
        endpoint = f"{base_url.rstrip('/')}/api/attendance/device-sync"
        try:
            req = urllib.request.Request(endpoint, headers={"User-Agent": "SkylandBridge/1.0"}, method="GET")
            with urllib.request.urlopen(req, timeout=3) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    print(f"[OK] Connected to Attendance Portal at: {endpoint}")
                    print(f"     Status: {data.get('status', 'Online')} | Timezone: {data.get('timezone', 'Asia/Karachi')}")
                    active_portal_endpoint = endpoint
                    return endpoint
        except Exception:
            continue
    print(f"[!] Warning: Could not reach portal on {PORTAL_URLS}. Will retry on punches.")
    active_portal_endpoint = f"{PORTAL_URLS[0].rstrip('/')}/api/attendance/device-sync"
    return active_portal_endpoint

def push_punch_to_portal(user_id, timestamp_iso=None, verify_mode="Fingerprint"):
    endpoint = active_portal_endpoint or find_active_portal()
    if not timestamp_iso:
        timestamp_iso = datetime.now().isoformat()

    payload = json.dumps({
        "punches": [{
            "userId": str(user_id).strip(),
            "timestamp": timestamp_iso,
            "verifyMode": verify_mode,
            "type": "AUTO"
        }]
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            results = res_data.get("results", [])
            for r in results:
                name = r.get("employeeName", "Unknown")
                emp_id = r.get("employeeId", r.get("userId", ""))
                action = r.get("action", "")
                status = r.get("status", "")
                print(f"[SYNC] DB UPDATED: {name} ({emp_id}) -> {action} [{status}] at {datetime.now().strftime('%H:%M:%S')}")
            return True
    except Exception as e:
        print(f"[X] Failed to push punch for User #{user_id} to portal: {e}")
        return False

def make_digest_auth_header(uri, method, auth_header, username, password):
    def get_val(key):
        m = re.search(r'' + key + r'="?([^",]+)"?', auth_header)
        return m.group(1) if m else ""

    realm = get_val("realm")
    nonce = get_val("nonce")
    qop = get_val("qop")
    opaque = get_val("opaque")

    ha1 = hashlib.md5(f"{username}:{realm}:{password}".encode("utf-8")).hexdigest()
    ha2 = hashlib.md5(f"{method}:{uri}".encode("utf-8")).hexdigest()

    nc = "00000001"
    cnonce = hashlib.md5(str(time.time()).encode("utf-8")).hexdigest()[:16]

    if "auth" in qop:
        response = hashlib.md5(f"{ha1}:{nonce}:{nc}:{cnonce}:auth:{ha2}".encode("utf-8")).hexdigest()
        header = f'Digest username="{username}", realm="{realm}", nonce="{nonce}", uri="{uri}", response="{response}", qop=auth, nc={nc}, cnonce="{cnonce}"'
    else:
        response = hashlib.md5(f"{ha1}:{nonce}:{ha2}".encode("utf-8")).hexdigest()
        header = f'Digest username="{username}", realm="{realm}", nonce="{nonce}", uri="{uri}", response="{response}"'

    if opaque:
        header += f', opaque="{opaque}"'
    return header

def test_dahua_connection(password=None):
    pw = password or DEVICE_PASS
    url = f"http://{DEVICE_IP}:{DEVICE_PORT}/cgi-bin/magicBox.cgi?action=getSystemInfo"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=4) as res:
            return True, "No auth required"
    except urllib.error.HTTPError as e:
        if e.code == 401:
            auth_hdr = e.headers.get("www-authenticate", "")
            if not auth_hdr:
                return False, "No WWW-Authenticate header"
            auth_val = make_digest_auth_header("/cgi-bin/magicBox.cgi?action=getSystemInfo", "GET", auth_hdr, DEVICE_USER, pw)
            try:
                req2 = urllib.request.Request(url, headers={"Authorization": auth_val}, method="GET")
                with urllib.request.urlopen(req2, timeout=4) as res2:
                    if res2.status == 200:
                        return True, "Authenticated"
            except urllib.error.HTTPError as e2:
                if e2.code == 403:
                    return False, "Locked out (Wait a few minutes or unlock on machine keypad)"
                return False, f"HTTP Error {e2.code}: Invalid password"
            except Exception as ex:
                return False, str(ex)
        return False, f"HTTP Error {e.code}"
    except Exception as e:
        return False, str(e)

def listen_event_stream():
    """Attaches to Dahua HTTP real-time event push stream."""
    path = "/cgi-bin/eventManager.cgi?action=attach&codes=[AccessControl]"
    url = f"http://{DEVICE_IP}:{DEVICE_PORT}{path}"
    print(f"[*] Attaching to Dahua real-time event stream at {url}...")

    try:
        req1 = urllib.request.Request(url, method="GET")
        try:
            resp = urllib.request.urlopen(req1, timeout=5)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                auth_hdr = e.headers.get("www-authenticate", "")
                auth_val = make_digest_auth_header(path, "GET", auth_hdr, DEVICE_USER, DEVICE_PASS)
                req2 = urllib.request.Request(url, headers={"Authorization": auth_val}, method="GET")
                resp = urllib.request.urlopen(req2, timeout=120)
            else:
                raise e

        print("[ONLINE] Live event stream connected! Listening for fingerprint punches...\n")
        buffer = ""
        while True:
            chunk = resp.read(512).decode("utf-8", errors="ignore")
            if not chunk:
                break
            buffer += chunk

            # Dahua emits events in format: Code=AccessControl;action=Pulse;data={...}
            while "\n\n" in buffer or "\r\n\r\n" in buffer:
                parts = re.split(r'\r?\n\r?\n', buffer, maxsplit=1)
                event_block = parts[0]
                buffer = parts[1] if len(parts) > 1 else ""

                if "Code=AccessControl" in event_block:
                    user_match = re.search(r'UserID="?(\d+)"?', event_block) or re.search(r'CardNo="?(\d+)"?', event_block)
                    time_match = re.search(r'CreateTime=(\d+)', event_block)
                    if user_match:
                        uid = user_match.group(1)
                        punch_time = datetime.fromtimestamp(int(time_match.group(1))).isoformat() if time_match else datetime.now().isoformat()
                        print(f"\n[SWIPE] FINGERPRINT DETECTED: User #{uid} at {punch_time}")
                        push_punch_to_portal(uid, punch_time, "Fingerprint")

    except Exception as e:
        print(f"[!] Event stream disconnected: {e}. Will retry in 5 seconds...")

def main():
    find_active_portal()

    # Quick test punch CLI option
    if "--test" in sys.argv:
        test_id = sys.argv[2] if len(sys.argv) > 2 else "1"
        print(f"\n[*] Sending verification test punch for User #{test_id}...")
        push_punch_to_portal(test_id)
        return

    ok, msg = test_dahua_connection()
    if ok:
        print(f"[✓] Dahua Terminal Authentication Successful: {msg}")
    else:
        print(f"[!] Notice from Dahua Terminal: {msg}")
        print("    If you recently swiped, punches are queued in Dahua memory.")

    print("\n[*] Starting Dahua Biometric Listener (Press Ctrl+C to stop)...")
    while True:
        try:
            listen_event_stream()
            time.sleep(5)
        except KeyboardInterrupt:
            print("\n[*] Stopping Dahua Bridge Agent.")
            break

if __name__ == "__main__":
    main()
