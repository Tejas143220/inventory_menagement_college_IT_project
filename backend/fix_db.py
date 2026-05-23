import psycopg2
try:
    from .models import Base
    from .database import engine
except ImportError:
    from models import Base
    from database import engine

conn = psycopg2.connect("postgresql://postgres:1432@localhost/inventory_db")
cur = conn.cursor()
cur.execute("DROP TABLE IF EXISTS sales CASCADE;")
cur.execute("DROP TABLE IF EXISTS purchases CASCADE;")
conn.commit()
conn.close()

Base.metadata.create_all(bind=engine)
print("Database schema updated successfully.")
