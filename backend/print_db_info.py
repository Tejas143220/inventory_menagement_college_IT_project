import sys
from pathlib import Path
import sqlite3
BASE_PATH = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_PATH))
from database import DATABASE_URL
import models

print('DATABASE_URL:', DATABASE_URL)
print('Product columns:', [c.name for c in models.Product.__table__.columns])
print('Purchase columns:', [c.name for c in models.Purchase.__table__.columns])
print('Sale columns:', [c.name for c in models.Sale.__table__.columns])
if DATABASE_URL.startswith('sqlite:///'):
    db_path = DATABASE_URL.replace('sqlite:///', '')
    db_path = Path(db_path)
    print('PATH:', db_path.resolve())
    print('EXISTS:', db_path.exists())
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    for tbl in ['products', 'purchases', 'sales']:
        cur.execute(f"PRAGMA table_info({tbl})")
        print(tbl, cur.fetchall())
    conn.close()
