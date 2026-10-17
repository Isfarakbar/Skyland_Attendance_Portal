with open('scripts/last_event.bin', 'rb') as f:
    raw_data = f.read()

import re, struct

KNOWN_EMPLOYEES = {
    '1': ('SKY-002', 'Isfar Akbar', ['isfar', 'akbar']),
    '2': ('SKY-004', 'Nadeem Akram', ['nadeem', 'akram']),
    '3': ('SKY-005', 'Muhammad Hassan', ['hassan']),
    '4': ('SKY-006', 'Muhammad Hamza', ['hamza']),
    '5': ('SKY-007', 'Amir Ali', ['amir ali']),
    '6': ('SKY-008', 'Amna Arshad', ['amna']),
    '7': ('SKY-009', 'Iqra Shamim', ['iqra']),
    '8': ('SKY-010', 'Aneeqa Nayyar', ['aneeqa']),
    '9': ('SKY-011', 'Amir Munir', ['amir munir']),
    '10': ('SKY-012', 'Saif Ullah', ['saif']),
    '11': ('SKY-013', 'Mariam Maqsood', ['mariam']),
    '14': ('SKY-014', 'Emaan Nadeem', ['emaan']),
    '15': ('SKY-015', 'Taha Tajumal', ['taha']),
    '16': ('SKY-016', 'Salman Shahid', ['salman']),
}

matched_user_id = None
# Strategy 1: Check known employee keywords/names directly in buffer
for bio_id, (emp_id, emp_name, keywords) in KNOWN_EMPLOYEES.items():
    for kw in keywords:
        pattern = re.compile(re.escape(kw.encode('ascii')), re.IGNORECASE)
        m = pattern.search(raw_data)
        if m:
            print(f'Matched name keyword "{kw}" at offset {m.start()} -> Bio ID #{bio_id} ({emp_name})')
            matched_user_id = bio_id
            break
    if matched_user_id:
        break

# Strategy 2: Check integer right before name or string tokens
if not matched_user_id:
    for m in re.finditer(rb'\x00([A-Za-z0-9_-]{2,32})\x00', raw_data):
        offset = m.start(1)
        s = m.group(1).decode('ascii', errors='ignore').strip()
        print(f'Token at {offset}: {s}')

print('Final resolved user ID:', matched_user_id)
