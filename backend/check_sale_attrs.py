import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from database import SessionLocal
import models
with SessionLocal() as db:
    sale = db.query(models.Sale).first()
    print('sale customer_id', sale.customer_id, type(sale.customer_id))
    print('hasattr customer_id', hasattr(sale, 'customer_id'))
    print('sale dict keys', list(sale.__dict__.keys()))
