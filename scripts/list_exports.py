import os
import pefile

pe = pefile.PE(r'C:\Program Files\SmartPSSLite\dhnetsdk.dll')
exports = []
for exp in pe.DIRECTORY_ENTRY_EXPORT.symbols:
    name = exp.name.decode('utf-8') if exp.name else ''
    if any(k in name.lower() for k in ['record', 'find', 'access', 'card', 'log', 'user', 'listen']):
        exports.append(name)

print(f"Total matching export functions ({len(exports)}):")
for f in exports[:50]:
    print(" ", f)
