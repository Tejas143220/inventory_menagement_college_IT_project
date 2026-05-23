import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from database import SessionLocal
import models
from schemas import SaleOut

with SessionLocal() as db:
    sale = db.query(models.Sale).first()
    print('sale', sale.id if sale else None)
    try:
        so = SaleOut.from_orm(sale)
        print('SaleOut', so)
    except Exception as e:
        print('SaleOut error', repr(e))
        raise
