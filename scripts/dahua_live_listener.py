"""
Skyland Attendance Portal - Dahua Native NetSDK Bridge Service
Directly connects to Dahua DHI-ASA1222GL-D Biometric Terminal (192.168.100.110:37777)
Listens for real-time employee finger swipes and syncs to MongoDB instantly.
"""

import sys
import os
import time
import json
import ctypes
from datetime import datetime
import urllib.request
import re

PORTAL_URLS = [
    "http://127.0.0.1:3001",
    "http://localhost:3001",
    "http://192.168.100.245:3001"
]

DEVICE_IP = b"192.168.100.110"
DEVICE_PORT = 37777
DEVICE_USER = b"admin"
DEVICE_PASS = b"skyland1122"

active_portal = None

# Known employee map for quick verification and logging
KNOWN_EMPLOYEES = {
    "1": ("SKY-002", "Isfar Akbar"),
    "2": ("SKY-004", "Nadeem Akram"),
    "3": ("SKY-005", "Muhammad Hassan"),
    "4": ("SKY-006", "Muhammad Hamza"),
    "5": ("SKY-007", "Amir Ali"),
    "6": ("SKY-008", "Amna Arshad"),
    "7": ("SKY-009", "Iqra Shamim"),
    "8": ("SKY-010", "Aneeqa Nayyar"),
    "9": ("SKY-011", "Amir Munir"),
    "10": ("SKY-012", "Saif Ullah"),
    "11": ("SKY-013", "Mariam Maqsood"),
}

print("==================================================================")
print("  SKYLAND ENERGY - DAHUA DHI-ASA1222GL-D NATIVE NETSDK BRIDGE")
print("==================================================================")
print(f"[*] Target Biometric Terminal : 192.168.100.110:{DEVICE_PORT}")
print(f"[*] User                      : admin")
print("==================================================================\n")

def find_active_portal():
    global active_portal
    for base_url in PORTAL_URLS:
        endpoint = f"{base_url.rstrip('/')}/api/attendance/device-sync"
        try:
            req = urllib.request.Request(endpoint, headers={"User-Agent": "SkylandBridge/1.0"}, method="GET")
            with urllib.request.urlopen(req, timeout=3) as res:
                if res.status == 200:
                    print(f"[OK] Connected to Attendance Portal: {endpoint}")
                    active_portal = endpoint
                    return endpoint
        except Exception:
            continue
    active_portal = f"{PORTAL_URLS[0].rstrip('/')}/api/attendance/device-sync"
    return active_portal

def push_punch_to_portal(user_id, timestamp_iso=None, verify_mode="Fingerprint"):
    endpoint = active_portal or find_active_portal()
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

# Load NetSDK
os.add_dll_directory(r'C:\Program Files\SmartPSSLite')
sdk = ctypes.cdll.LoadLibrary(r'C:\Program Files\SmartPSSLite\dhnetsdk.dll')

sdk.CLIENT_Init.argtypes = [ctypes.c_void_p, ctypes.c_longlong]
sdk.CLIENT_Init.restype = ctypes.c_bool

sdk.CLIENT_Login.argtypes = [
    ctypes.c_char_p,
    ctypes.c_ushort,
    ctypes.c_char_p,
    ctypes.c_char_p,
    ctypes.c_void_p,
    ctypes.POINTER(ctypes.c_int)
]
sdk.CLIENT_Login.restype = ctypes.c_longlong

sdk.CLIENT_Logout.argtypes = [ctypes.c_longlong]
sdk.CLIENT_Logout.restype = ctypes.c_bool

sdk.CLIENT_Cleanup.argtypes = []
sdk.CLIENT_Cleanup.restype = None

sdk.CLIENT_StartListenEx.argtypes = [ctypes.c_longlong]
sdk.CLIENT_StartListenEx.restype = ctypes.c_bool

sdk.CLIENT_StopListen.argtypes = [ctypes.c_longlong]
sdk.CLIENT_StopListen.restype = ctypes.c_bool

# Callback definition: pBuf MUST BE c_void_p so ctypes does not treat it as a null-terminated string!
fMessCallBack = ctypes.CFUNCTYPE(
    ctypes.c_bool,
    ctypes.c_int,       # lCommand
    ctypes.c_longlong,  # lLoginID
    ctypes.c_void_p,    # pBuf (raw C pointer)
    ctypes.c_ulong,     # dwBufLen
    ctypes.c_char_p,    # pchDVRIP
    ctypes.c_long,      # nDVRPort
    ctypes.c_longlong   # dwUser
)

# Structs for access control event
class NET_TIME(ctypes.Structure):
    _fields_ = [
        ("dwYear", ctypes.c_uint32),
        ("dwMonth", ctypes.c_uint32),
        ("dwDay", ctypes.c_uint32),
        ("dwHour", ctypes.c_uint32),
        ("dwMinute", ctypes.c_uint32),
        ("dwSecond", ctypes.c_uint32),
    ]

class ALARM_ACCESS_CTL_EVENT_INFO(ctypes.Structure):
    _fields_ = [
        ("dwSize", ctypes.c_uint32),
        ("nChannelID", ctypes.c_int32),
        ("szDevID", ctypes.c_char * 32),
        ("stuTime", NET_TIME),
        ("szCardNo", ctypes.c_char * 32),
        ("szCardName", ctypes.c_char * 32),
        ("szUserID", ctypes.c_char * 32),
        ("bStatus", ctypes.c_int32),
        ("emMethod", ctypes.c_int32),
        ("emAction", ctypes.c_int32),
    ]

@fMessCallBack
def message_callback(lCommand, lLoginID, pBuf, dwBufLen, pchDVRIP, nDVRPort, dwUser):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Ignore 0x300C keepalive heartbeat notifications
    if lCommand == 0x300C:
        return True

    if not pBuf or dwBufLen == 0:
        return True

    raw_len = min(dwBufLen, 16384)
    raw_data = ctypes.string_at(pBuf, raw_len)

    # Save to disk for inspection
    try:
        bin_path = os.path.join(os.path.dirname(__file__), "last_event.bin")
        with open(bin_path, "wb") as f:
            f.write(raw_data)
    except Exception:
        pass

    print(f"\n[SWIPE EVENT 0x{lCommand:X}] at {now_str} (Len: {dwBufLen} bytes)")

    # 1. Try struct-based parsing first
    user_id = None
    card_no = None
    try:
        if raw_len >= ctypes.sizeof(ALARM_ACCESS_CTL_EVENT_INFO):
            info = ALARM_ACCESS_CTL_EVENT_INFO.from_buffer_copy(raw_data)
            u_id = info.szUserID.decode('utf-8', errors='ignore').strip()
            c_no = info.szCardNo.decode('utf-8', errors='ignore').strip()
            if u_id and any(c.isdigit() for c in u_id):
                user_id = u_id
                print(f"    [STRUCT PARSER] szUserID: '{user_id}', szCardNo: '{c_no}'")
            if c_no:
                card_no = c_no
    except Exception as e:
        print(f"    [STRUCT ERROR] {e}")

    # 2. Extract clean strings from raw_data:
    # A genuine string in C is flanked by NUL bytes and starts at offset >= 4 (to skip dwSize)
    found_tokens = []
    # Match strings of 1-32 alphanumeric/dash/underscore characters flanked by NUL
    for m in re.finditer(rb'\x00([A-Za-z0-9_-]{1,32})\x00', raw_data):
        offset = m.start(1)
        if offset < 4:
            continue # Skip dwSize
        s = m.group(1).decode('ascii', errors='ignore').strip()
        if s and s not in ["192", "168", "100", "110", "admin", "skyland1122"]:
            found_tokens.append((offset, s))

    # Also match start of string if offset >= 8
    for m in re.finditer(rb'([A-Za-z0-9_-]{1,32})\x00', raw_data[8:]):
        offset = 8 + m.start(1)
        s = m.group(1).decode('ascii', errors='ignore').strip()
        if s and s not in ["192", "168", "100", "110", "admin", "skyland1122"]:
            if not any(t[1] == s and abs(t[0] - offset) < 2 for t in found_tokens):
                found_tokens.append((offset, s))

    print(f"    [RAW TOKENS DETECTED]: {found_tokens[:15]}")

    # 3. Match against known employee biometric IDs
    if not user_id:
        # Check if any token matches known biometric ID
        for offset, token in found_tokens:
            if token in KNOWN_EMPLOYEES:
                user_id = token
                emp_id, emp_name = KNOWN_EMPLOYEES[token]
                print(f"    [MATCHED BIOMETRIC ID #{token}]: {emp_name} ({emp_id}) at offset {offset}")
                break

    if not user_id:
        # Check if any token matches employee ID (e.g. SKY-002)
        for offset, token in found_tokens:
            for bio_id, (emp_id, emp_name) in KNOWN_EMPLOYEES.items():
                if token.upper() == emp_id.upper() or token.lower() in emp_name.lower():
                    user_id = bio_id
                    print(f"    [MATCHED EMPLOYEE {emp_id}]: {emp_name} -> ID {bio_id}")
                    break
            if user_id:
                break

    if not user_id and found_tokens:
        # Check first token that is purely numeric and <= 4 digits
        for offset, token in found_tokens:
            if token.isdigit() and 1 <= int(token) <= 50:
                user_id = token
                print(f"    [NUMERIC CANDIDATE]: User #{token} at offset {offset}")
                break

    if user_id:
        emp_info = KNOWN_EMPLOYEES.get(str(user_id), ("Unknown", "Staff"))
        print(f"[SWIPE] >> RECOGNIZED SWIPE: User #{user_id} ({emp_info[1]} - {emp_info[0]})")
        push_punch_to_portal(user_id, datetime.now().isoformat(), "Fingerprint")
    else:
        print("[!] No recognized user identifier could be resolved from buffer.")

    return True

sdk.CLIENT_SetDVRMessCallBackEx1.argtypes = [fMessCallBack, ctypes.c_longlong]
sdk.CLIENT_SetDVRMessCallBackEx1.restype = None

def run_service():
    find_active_portal()

    if not sdk.CLIENT_Init(0, 0):
        print("[X] Failed to initialize Dahua NetSDK.")
        return

    # Keep callback reference alive
    global _cb_ref
    _cb_ref = message_callback
    sdk.CLIENT_SetDVRMessCallBackEx1(_cb_ref, 0)

    device_info = (ctypes.c_byte * 1024)()
    error = ctypes.c_int(0)

    print(f"[*] Logging in to Dahua Terminal {DEVICE_IP.decode()}...")
    login_id = sdk.CLIENT_Login(
        DEVICE_IP,
        DEVICE_PORT,
        DEVICE_USER,
        DEVICE_PASS,
        ctypes.byref(device_info),
        ctypes.byref(error)
    )

    if login_id == 0:
        print(f"[X] Login failed! Error Code: {error.value}")
        sdk.CLIENT_Cleanup()
        return

    print(f"[OK] LOGIN SUCCESSFUL! Terminal Session ID: {login_id}")
    print("[*] Subscribing to real-time swipe alarm stream...")

    listen_ok = sdk.CLIENT_StartListenEx(login_id)
    if listen_ok:
        print("[OK] Real-time event listener ACTIVE! Waiting for finger swipes on physical terminal...\n")
    else:
        print("[!] StartListenEx returned False, callback listener remains active.\n")

    print("[*] Biometric Bridge is running. Touch your registered finger on the sensor now!")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Stopping listener and disconnecting from terminal...")
        sdk.CLIENT_StopListen(login_id)
        sdk.CLIENT_Logout(login_id)
        sdk.CLIENT_Cleanup()
        print("[*] NetSDK Bridge stopped.")

if __name__ == "__main__":
    run_service()
