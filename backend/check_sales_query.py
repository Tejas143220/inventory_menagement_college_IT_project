import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from database import SessionLocal
import models

with SessionLocal() as db:
    try:
        sales = db.query(models.Sale).order_by(models.Sale.sale_date.desc()).all()
        print('sales count', len(sales))
        for sale in sales[:3]:
            print('sale', sale.id, sale.invoice_number, sale.sale_date, type(sale.sale_date))
            print('customer attr', hasattr(sale, 'customer'))
    except Exception as e:
        print('query error', repr(e))
        raise
