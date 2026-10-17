import sqlite3

db_path = r'C:\Program Files\SmartPSSLite\Default\AccessControl.db'
try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table';")
    tables = cur.fetchall()
    print(f"Total tables: {len(tables)}")
    for name, sql in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{name}";')
        cnt = cur.fetchone()[0]
        print(f"Table: {name} (Rows: {cnt})")
        if cnt > 0:
            cur.execute(f'PRAGMA table_info("{name}");')
            cols = [col[1] for col in cur.fetchall()]
            print(f"  Columns: {cols}")
            cur.execute(f'SELECT * FROM "{name}" ORDER BY rowid DESC LIMIT 3;')
            for r in cur.fetchall():
                print(f"  Record: {r}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
