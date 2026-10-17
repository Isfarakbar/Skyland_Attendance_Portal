import os
import sys
import ctypes
from ctypes import wintypes

os.add_dll_directory(r'C:\Program Files\SmartPSSLite')
sdk = ctypes.cdll.LoadLibrary(r'C:\Program Files\SmartPSSLite\dhnetsdk.dll')

# NET_DEVICEINFO_Ex struct (enough buffer for device info)
class NET_DEVICEINFO_Ex(ctypes.Structure):
    _fields_ = [
        ("sSerialNumber", ctypes.c_char * 48),
        ("byAlarmInPortNum", ctypes.c_byte),
        ("byAlarmOutPortNum", ctypes.c_byte),
        ("byDiskNum", ctypes.c_byte),
        ("byDVRType", ctypes.c_byte),
        ("byChanNum", ctypes.c_byte),
        ("byLimitLoginTime", ctypes.c_byte),
        ("byLeftLogTimes", ctypes.c_byte),
        ("bReserved", ctypes.c_byte),
        ("byLockTime", ctypes.c_int),
        ("bLoginSpecCap", ctypes.c_int),
        ("reserved", ctypes.c_char * 268)
    ]

# Init SDK
fDisConnect = ctypes.CFUNCTYPE(None, ctypes.c_longlong, ctypes.c_char_p, ctypes.c_int, ctypes.c_longlong)(0)
sdk.CLIENT_Init.argtypes = [ctypes.c_void_p, ctypes.c_longlong]
sdk.CLIENT_Init.restype = ctypes.c_bool

ret = sdk.CLIENT_Init(0, 0)
print(f"CLIENT_Init: {ret}")

# Login
sdk.CLIENT_Login.argtypes = [
    ctypes.c_char_p,
    ctypes.c_ushort,
    ctypes.c_char_p,
    ctypes.c_char_p,
    ctypes.c_void_p,
    ctypes.POINTER(ctypes.c_int)
]
sdk.CLIENT_Login.restype = ctypes.c_longlong

device_info = NET_DEVICEINFO_Ex()
error = ctypes.c_int(0)

ip = b"192.168.100.110"
port = 37777
user = b"admin"
password = b"skyland1122"

login_id = sdk.CLIENT_Login(ip, port, user, password, ctypes.byref(device_info), ctypes.byref(error))
print(f"Login Result ID: {login_id}, Error Code: {error.value}")
if login_id != 0:
    print(f"SUCCESS! Connected to Dahua terminal!")
    print(f"Serial Number: {device_info.sSerialNumber.decode('utf-8', errors='ignore').strip()}")
    sdk.CLIENT_Logout(login_id)
else:
    print(f"Failed to log in. Error code: {error.value}")

sdk.CLIENT_Cleanup()
