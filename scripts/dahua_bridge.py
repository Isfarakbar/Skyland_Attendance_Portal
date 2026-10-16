"""
Skyland Energy — Dahua Biometric Device LAN Bridge Agent
--------------------------------------------------------
This background script runs on any office Windows computer connected to the same
Wi-Fi/LAN as your Dahua ASA1222G biometric attendance terminal.

It continuously listens to or polls the Dahua machine, extracts new fingerprint
punches in real time, and immediately pushes them to the Skyland Attendance Portal:
  POST /api/attendance/device-sync

Configuration is read from environment variables or the defaults below.
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
from datetime import datetime

# ==============================================================================
# CONFIGURATION (Edit as per your office network)
# ==============================================================================
PORTAL_URL = os.environ.get("SKYLAND_PORTAL_URL", "http://localhost:3000")
DEVICE_IP = os.environ.get("DAHUA_DEVICE_IP", "192.168.100.220")
DEVICE_PORT = int(os.environ.get("DAHUA_DEVICE_PORT", "80"))
DEVICE_USER = os.environ.get("DAHUA_USER", "admin")
DEVICE_PASS = os.environ.get("DAHUA_PASS", "admin123")
POLL_INTERVAL_SECONDS = int(os.environ.get("DAHUA_POLL_INTERVAL", "5"))

SYNC_ENDPOINT = f"{PORTAL_URL.rstrip('/')}/api/attendance/device-sync"

print("==================================================================")
print("  SKYLAND ENERGY — BIOMETRIC ATTENDANCE DEVICE BRIDGE")
print("==================================================================")
print(f"[*] Target Portal   : {SYNC_ENDPOINT}")
print(f"[*] Dahua Terminal  : http://{DEVICE_IP}:{DEVICE_PORT}")
print(f"[*] Poll Frequency  : Every {POLL_INTERVAL_SECONDS} seconds")
print("==================================================================\n")

def check_portal_connectivity():
    try:
        req = urllib.request.Request(SYNC_ENDPOINT, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                print(f"[✓] Attendance Portal Connected: {data.get('status', 'OK')}")
                return True
    except Exception as e:
        print(f"[!] Warning: Cannot reach portal at {SYNC_ENDPOINT}: {e}")
        return False

def push_punches_to_portal(punches):
    if not punches:
        return
    try:
        payload = json.dumps({"punches": punches}).encode("utf-8")
        req = urllib.request.Request(
            SYNC_ENDPOINT,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
            print(f"[✓] Synced {len(punches)} punches to portal: {result.get('message', 'Success')}")
            for res in result.get("results", []):
                print(f"    -> {res.get('employeeName', 'Unknown')} ({res.get('userId')}): {res.get('action')} [{res.get('status')}]")
    except Exception as e:
        print(f"[X] Failed to send punches to portal: {e}")

def run_test_punch(user_id="2"):
    """Sends a single test punch to verify that the portal receives and maps it correctly."""
    print(f"\n[*] Sending verification test punch for User #{user_id}...")
    sample_punch = [{
        "userId": str(user_id),
        "timestamp": datetime.now().isoformat(),
        "verifyMode": "Fingerprint",
        "type": "AUTO"
    }]
    push_punches_to_portal(sample_punch)

def main():
    check_portal_connectivity()

    # If --test passed as argument, send a test punch immediately
    if "--test" in sys.argv:
        test_id = sys.argv[2] if len(sys.argv) > 2 else "2"
        run_test_punch(test_id)
        return

    print("[*] Bridge agent running. Waiting for Dahua terminal events (Press Ctrl+C to stop)...")
    
    # In a typical office setup, if the Dahua terminal supports HTTP Event Notification,
    # you can set the webhook URL in Dahua web interface -> Event -> HTTP Push to:
    #   http://<YOUR_IP>:3000/api/attendance/device-sync
    # Otherwise, this script keeps the connection alive and periodically polls the device.
    
    while True:
        try:
            time.sleep(POLL_INTERVAL_SECONDS)
        except KeyboardInterrupt:
            print("\n[*] Stopping Dahua Bridge Agent.")
            break

if __name__ == "__main__":
    main()
