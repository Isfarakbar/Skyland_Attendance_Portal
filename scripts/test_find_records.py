import os
import sys
import ctypes
from datetime import datetime

os.add_dll_directory(r'C:\Program Files\SmartPSSLite')
sdk = ctypes.cdll.LoadLibrary(r'C:\Program Files\SmartPSSLite\dhnetsdk.dll')

sdk.CLIENT_Init(0, 0)

dev_info = (ctypes.c_byte * 1024)()
err = ctypes.c_int(0)
lid = sdk.CLIENT_Login(b"192.168.100.110", 37777, b"admin", b"skyland1122", ctypes.byref(dev_info), ctypes.byref(err))
print(f"Login handle: {lid}")

if lid == 0:
    print("Login failed!")
    sys.exit(1)

# Find Record for Access Control / Card records
# NET_RECORD_ACCESSCTLCARDREC = 0
class NET_TIME(ctypes.Structure):
    _fields_ = [
        ("dwYear", ctypes.c_uint32),
        ("dwMonth", ctypes.c_uint32),
        ("dwDay", ctypes.c_uint32),
        ("dwHour", ctypes.c_uint32),
        ("dwMinute", ctypes.c_uint32),
        ("dwSecond", ctypes.c_uint32),
    ]

class FIND_RECORD_ACCESSCTLCARDREC_CONDITION(ctypes.Structure):
    _fields_ = [
        ("dwSize", ctypes.c_uint32),
        ("bTimeEnable", ctypes.c_bool),
        ("stStartTime", NET_TIME),
        ("stEndTime", NET_TIME),
        ("szCardNo", ctypes.c_char * 32),
        ("szUserID", ctypes.c_char * 32),
    ]

# Setup Condition
cond = FIND_RECORD_ACCESSCTLCARDREC_CONDITION()
cond.dwSize = ctypes.sizeof(cond)
cond.bTimeEnable = False # Get all latest records

sdk.CLIENT_FindRecord.argtypes = [ctypes.c_longlong, ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int]
sdk.CLIENT_FindRecord.restype = ctypes.c_longlong

sdk.CLIENT_FindNextRecord.argtypes = [ctypes.c_longlong, ctypes.c_int, ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_int]
sdk.CLIENT_FindNextRecord.restype = ctypes.c_int

sdk.CLIENT_FindRecordClose.argtypes = [ctypes.c_longlong]
sdk.CLIENT_FindRecordClose.restype = ctypes.c_bool

# Try record types: 0 (AccessControlCardRec), 1, 2, 3
for rtype in range(5):
    find_handle = sdk.CLIENT_FindRecord(lid, rtype, ctypes.byref(cond), None, 5000)
    print(f"RecordType {rtype} -> FindHandle: {find_handle}")
    if find_handle != 0:
        # Buffer for records
        buf = (ctypes.c_byte * 16384)()
        ret_num = sdk.CLIENT_FindNextRecord(find_handle, 10, buf, len(buf), None, 5000)
        print(f"   FindNextRecord returned: {ret_num} records")
        if ret_num > 0:
            # Print strings inside buf
            text = ctypes.string_at(buf, 16384).decode('latin1', errors='ignore')
            import re
            words = re.findall(r'[A-Za-z0-9_-]{2,20}', text)
            print("   Words found in records:", words[:20])
        sdk.CLIENT_FindRecordClose(find_handle)

sdk.CLIENT_Logout(lid)
sdk.CLIENT_Cleanup()
