import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
for path in [BASE_DIR / 'inventory.db', BASE_DIR.parent / 'inventory.db']:
    if path.exists():
        path.unlink()
        print('removed', path)

from main import app
print('imported app')
from database import engine, Base
Base.metadata.create_all(bind=engine)
print('recreated schema in', BASE_DIR / 'inventory.db')
