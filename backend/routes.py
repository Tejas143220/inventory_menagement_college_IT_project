import os
import shutil
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    File,
    UploadFile,
    Query
)
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    from .database import get_db
    from . import models
    from . import schemas
    from . import auth
except ImportError:
    from database import get_db
    import models
    import schemas
    import auth

router = APIRouter()

# Helper function to create activity logs
def log_activity(db: Session, action: str, details: str, user_id: Optional[int] = None):
    log = models.ActivityLog(
        user_id=user_id,
        action=action,
        details=details,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()

# Helper function to check/create low stock notification
def check_low_stock(db: Session, product_id: int, warehouse_id: int, stock: int, min_stock: int):
    if stock <= min_stock:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
        prod_name = product.name if product else f"Product ID {product_id}"
        wh_name = warehouse.name if warehouse else f"Warehouse ID {warehouse_id}"
        
        # Check if notification already exists recently (e.g. today)
        exists = db.query(models.Notification).filter(
            models.Notification.type == "low_stock",
            models.Notification.message.like(f"%{prod_name}%{wh_name}%"),
            models.Notification.is_read == False
        ).first()
        
        if not exists:
            notification = models.Notification(
                title="Low Stock Alert",
                message=f"Stock of {prod_name} in {wh_name} is {stock}, which is below the minimum required limit of {min_stock}.",
                type="low_stock",
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(notification)
            db.commit()

# =================================================
# AUTH & PROFILE ENDPOINTS
# =================================================

@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    exists_username = db.query(models.User).filter(models.User.username == user_in.username).first()
    if exists_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    exists_email = db.query(models.User).filter(models.User.email == user_in.email).first()
    if exists_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        username=user_in.username,
        email=user_in.email,
        password=auth.hash_password(user_in.password),
        role="admin"  # Hardcoded to admin per instructions
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_activity(db, "REGISTER", f"Registered new admin account: {new_user.username}", new_user.id)
    return new_user

@router.post("/login")
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    token = auth.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    
    log_activity(db, "LOGIN", f"Admin login successful: {user.username}", user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user.get("id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/me", response_model=schemas.UserOut)
def update_me(
    username: str = Query(...),
    email: str = Query(...),
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user.get("id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check uniqueness if changed
    if user.username != username:
        exists = db.query(models.User).filter(models.User.username == username).first()
        if exists:
            raise HTTPException(status_code=400, detail="Username already in use")
    
    if user.email != email:
        exists = db.query(models.User).filter(models.User.email == email).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email already in use")
            
    user.username = username
    user.email = email
    db.commit()
    db.refresh(user)
    
    log_activity(db, "UPDATE_PROFILE", f"Updated profile details: {user.username}", user.id)
    return user

@router.put("/me/change-password")
def change_password(
    pwd_in: schemas.ChangePassword,
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user.get("id")).first()
    if not user or not auth.verify_password(pwd_in.old_password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    user.password = auth.hash_password(pwd_in.new_password)
    db.commit()
    
    log_activity(db, "CHANGE_PASSWORD", f"Password changed for user: {user.username}", user.id)
    return {"message": "Password changed successfully"}

# =================================================
# CATEGORIES ENDPOINTS
# =================================================

@router.get("/categories", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Category).all()

@router.post("/categories", response_model=schemas.CategoryOut)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    exists = db.query(models.Category).filter(models.Category.name == cat.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    new_cat = models.Category(name=cat.name, description=cat.description)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    
    log_activity(db, "CREATE_CATEGORY", f"Created category: {new_cat.name}", current_user.get("id"))
    return new_cat

@router.put("/categories/{id}", response_model=schemas.CategoryOut)
def update_category(id: int, cat: schemas.CategoryUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    category = db.query(models.Category).filter(models.Category.id == id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Check name collision
    exists = db.query(models.Category).filter(models.Category.name == cat.name, models.Category.id != id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
        
    category.name = cat.name
    category.description = cat.description
    db.commit()
    db.refresh(category)
    
    log_activity(db, "UPDATE_CATEGORY", f"Updated category ID {id} to name: {category.name}", current_user.get("id"))
    return category

@router.delete("/categories/{id}")
def delete_category(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    category = db.query(models.Category).filter(models.Category.id == id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    
    log_activity(db, "DELETE_CATEGORY", f"Deleted category ID {id}", current_user.get("id"))
    return {"message": "Category deleted successfully"}

# =================================================
# PRODUCTS ENDPOINTS
# =================================================

@router.get("/products", response_model=List[schemas.ProductOut])
def get_products(
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.admin_only)
):
    query = db.query(models.Product)
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if status:
        query = query.filter(models.Product.status == status)
    if search:
        query = query.filter(
            models.Product.name.like(f"%{search}%") | 
            models.Product.sku.like(f"%{search}%") | 
            (models.Product.barcode.like(f"%{search}%") if models.Product.barcode is not None else False)
        )
    return query.all()

@router.post("/products", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    # Check if SKU is unique
    exists = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if exists:
        raise HTTPException(status_code=400, detail="SKU already exists")
        
    new_product = models.Product(
        name=product.name,
        description=product.description,
        sku=product.sku,
        barcode=product.barcode,
        price=product.price,
        purchase_price=product.purchase_price,
        quantity=0,  # Initially 0, updated via purchases or manual inventory addition
        image=product.image,
        status=product.status or "active",
        category_id=product.category_id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    log_activity(db, "CREATE_PRODUCT", f"Created product: {new_product.name} (SKU: {new_product.sku})", current_user.get("id"))
    return new_product

@router.put("/products/{id}", response_model=schemas.ProductOut)
def update_product(id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    prod = db.query(models.Product).filter(models.Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Check SKU unique constraint
    exists = db.query(models.Product).filter(models.Product.sku == product.sku, models.Product.id != id).first()
    if exists:
        raise HTTPException(status_code=400, detail="SKU already exists on another product")
        
    prod.name = product.name
    prod.description = product.description
    prod.sku = product.sku
    prod.barcode = product.barcode
    prod.price = product.price
    prod.purchase_price = product.purchase_price
    prod.status = product.status
    prod.category_id = product.category_id
    
    db.commit()
    db.refresh(prod)
    
    log_activity(db, "UPDATE_PRODUCT", f"Updated product ID {id}: {prod.name}", current_user.get("id"))
    return prod

@router.delete("/products/{id}")
def delete_product(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    prod = db.query(models.Product).filter(models.Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db.delete(prod)
    db.commit()
    
    log_activity(db, "DELETE_PRODUCT", f"Deleted product ID {id}", current_user.get("id"))
    return {"message": "Product deleted successfully"}

@router.post("/products/{id}/image")
def upload_product_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.admin_only)
):
    prod = db.query(models.Product).filter(models.Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Create static upload dir if not exists
    os.makedirs("static/uploads", exist_ok=True)
    
    file_ext = file.filename.split(".")[-1]
    filename = f"product_{id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
    file_path = os.path.join("static/uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Set relative URL for frontend
    prod.image = f"/static/uploads/{filename}"
    db.commit()
    
    log_activity(db, "UPLOAD_PRODUCT_IMAGE", f"Uploaded image for product ID {id}", current_user.get("id"))
    return {"image_url": prod.image}

# =================================================
# WAREHOUSES ENDPOINTS
# =================================================

@router.get("/warehouses", response_model=List[schemas.WarehouseOut])
def get_warehouses(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Warehouse).all()

@router.post("/warehouses", response_model=schemas.WarehouseOut)
def create_warehouse(wh: schemas.WarehouseCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    new_wh = models.Warehouse(
        name=wh.name,
        location=wh.location,
        capacity=wh.capacity,
        status=wh.status or "active"
    )
    db.add(new_wh)
    db.commit()
    db.refresh(new_wh)
    
    log_activity(db, "CREATE_WAREHOUSE", f"Created warehouse: {new_wh.name} in {new_wh.location}", current_user.get("id"))
    return new_wh

@router.put("/warehouses/{id}", response_model=schemas.WarehouseOut)
def update_warehouse(id: int, wh: schemas.WarehouseUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    warehouse.name = wh.name
    warehouse.location = wh.location
    warehouse.capacity = wh.capacity
    warehouse.status = wh.status
    
    db.commit()
    db.refresh(warehouse)
    
    log_activity(db, "UPDATE_WAREHOUSE", f"Updated warehouse ID {id}: {warehouse.name}", current_user.get("id"))
    return warehouse

@router.delete("/warehouses/{id}")
def delete_warehouse(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    db.delete(warehouse)
    db.commit()
    
    log_activity(db, "DELETE_WAREHOUSE", f"Deleted warehouse ID {id}", current_user.get("id"))
    return {"message": "Warehouse deleted successfully"}

# =================================================
# INVENTORY ENDPOINTS
# =================================================

@router.get("/inventory", response_model=List[schemas.InventoryOut])
def get_inventory(
    warehouse_id: Optional[int] = None,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.admin_only)
):
    query = db.query(models.Inventory)
    if warehouse_id:
        query = query.filter(models.Inventory.warehouse_id == warehouse_id)
    if product_id:
        query = query.filter(models.Inventory.product_id == product_id)
    return query.all()

@router.post("/inventory", response_model=schemas.InventoryOut)
def create_inventory(inventory_in: schemas.InventoryCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    product = db.query(models.Product).filter(models.Product.id == inventory_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == inventory_in.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    existing = db.query(models.Inventory).filter(
        models.Inventory.product_id == inventory_in.product_id,
        models.Inventory.warehouse_id == inventory_in.warehouse_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory record already exists for this product and warehouse")

    new_inv = models.Inventory(
        product_id=inventory_in.product_id,
        warehouse_id=inventory_in.warehouse_id,
        stock=inventory_in.stock,
        minimum_stock=inventory_in.minimum_stock,
        damaged_stock=inventory_in.damaged_stock or 0
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)

    total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.product_id == inventory_in.product_id).scalar() or 0
    product.quantity = total_stock
    db.commit()

    mov = models.StockMovement(
        product_id=inventory_in.product_id,
        quantity=inventory_in.stock,
        type="adjustment",
        from_warehouse_id=None,
        to_warehouse_id=inventory_in.warehouse_id,
        description=f"Created inventory record with initial stock {inventory_in.stock}"
    )
    db.add(mov)
    db.commit()

    log_activity(db, "CREATE_INVENTORY", f"Created inventory for product {inventory_in.product_id} in warehouse {inventory_in.warehouse_id} with stock {inventory_in.stock}", current_user.get("id"))
    return new_inv

@router.put("/inventory/{id}", response_model=schemas.InventoryOut)
def update_inventory(id: int, inventory_in: schemas.InventoryUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    inv = db.query(models.Inventory).filter(models.Inventory.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    old_stock = inv.stock
    inv.stock = inventory_in.stock
    inv.minimum_stock = inventory_in.minimum_stock
    inv.damaged_stock = inventory_in.damaged_stock

    db.commit()
    db.refresh(inv)

    total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.product_id == inv.product_id).scalar() or 0
    product = db.query(models.Product).filter(models.Product.id == inv.product_id).first()
    if product:
        product.quantity = total_stock
    db.commit()

    mov = models.StockMovement(
        product_id=inv.product_id,
        quantity=inventory_in.stock - old_stock,
        type="adjustment",
        from_warehouse_id=None,
        to_warehouse_id=inv.warehouse_id,
        description=f"Updated inventory record ID {id} from {old_stock} to {inventory_in.stock}"
    )
    db.add(mov)
    db.commit()

    log_activity(db, "UPDATE_INVENTORY", f"Updated inventory ID {id} in warehouse {inv.warehouse_id}", current_user.get("id"))
    return inv

@router.delete("/inventory/{id}")
def delete_inventory(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    inv = db.query(models.Inventory).filter(models.Inventory.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    product_id = inv.product_id
    db.delete(inv)
    db.commit()

    total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.product_id == product_id).scalar() or 0
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product:
        product.quantity = total_stock
        db.commit()

    log_activity(db, "DELETE_INVENTORY", f"Deleted inventory ID {id} from warehouse {inv.warehouse_id}", current_user.get("id"))
    return {"message": "Inventory record deleted successfully"}

@router.post("/inventory/transfer")
def transfer_stock(transfer: schemas.WarehouseTransfer, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    # 1. Source inventory
    src_inv = db.query(models.Inventory).filter(
        models.Inventory.product_id == transfer.product_id,
        models.Inventory.warehouse_id == transfer.from_warehouse_id
    ).first()
    
    if not src_inv or src_inv.stock < transfer.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in source warehouse")
        
    # 2. Check destination warehouse exists
    dest_wh = db.query(models.Warehouse).filter(models.Warehouse.id == transfer.to_warehouse_id).first()
    if not dest_wh:
        raise HTTPException(status_code=404, detail="Destination warehouse not found")
        
    # 3. Destination inventory
    dest_inv = db.query(models.Inventory).filter(
        models.Inventory.product_id == transfer.product_id,
        models.Inventory.warehouse_id == transfer.to_warehouse_id
    ).first()
    
    if not dest_inv:
        dest_inv = models.Inventory(
            product_id=transfer.product_id,
            warehouse_id=transfer.to_warehouse_id,
            stock=0,
            minimum_stock=100,
            damaged_stock=0
        )
        db.add(dest_inv)
        
    # Perform transfer
    src_inv.stock -= transfer.quantity
    dest_inv.stock += transfer.quantity
    
    # Log stock movements
    m1 = models.StockMovement(
        product_id=transfer.product_id,
        quantity=-transfer.quantity,
        type="transfer",
        from_warehouse_id=transfer.from_warehouse_id,
        to_warehouse_id=transfer.to_warehouse_id,
        description=f"Transferred {transfer.quantity} to Warehouse ID {transfer.to_warehouse_id}"
    )
    m2 = models.StockMovement(
        product_id=transfer.product_id,
        quantity=transfer.quantity,
        type="transfer",
        from_warehouse_id=transfer.from_warehouse_id,
        to_warehouse_id=transfer.to_warehouse_id,
        description=f"Received {transfer.quantity} from Warehouse ID {transfer.from_warehouse_id}"
    )
    db.add(m1)
    db.add(m2)
    db.commit()
    
    # Check low stock notification on source
    check_low_stock(db, src_inv.product_id, src_inv.warehouse_id, src_inv.stock, src_inv.minimum_stock)
    
    log_activity(db, "STOCK_TRANSFER", f"Transferred {transfer.quantity} units of product ID {transfer.product_id} from warehouse {transfer.from_warehouse_id} to {transfer.to_warehouse_id}", current_user.get("id"))
    return {"message": "Stock transfer completed successfully"}

@router.post("/inventory/adjust")
def adjust_inventory(adj: schemas.InventoryAdjustment, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    inv = db.query(models.Inventory).filter(
        models.Inventory.product_id == adj.product_id,
        models.Inventory.warehouse_id == adj.warehouse_id
    ).first()
    
    if not inv:
        inv = models.Inventory(
            product_id=adj.product_id,
            warehouse_id=adj.warehouse_id,
            stock=0,
            minimum_stock=100,
            damaged_stock=0
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)
        
    old_stock = inv.stock
    old_damaged = inv.damaged_stock
    
    inv.stock = adj.stock
    inv.damaged_stock = adj.damaged_stock
    
    stock_difference = adj.stock - old_stock
    
    # Recalculate total product quantity across all warehouses
    total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.product_id == adj.product_id).scalar() or 0
    product = db.query(models.Product).filter(models.Product.id == adj.product_id).first()
    if product:
        product.quantity = total_stock
        
    # Log stock movement
    mov = models.StockMovement(
        product_id=adj.product_id,
        quantity=stock_difference,
        type="adjustment",
        from_warehouse_id=None,
        to_warehouse_id=adj.warehouse_id,
        description=adj.description or f"Manual stock adjustment from {old_stock} to {adj.stock} (Damaged change from {old_damaged} to {adj.damaged_stock})"
    )
    db.add(mov)
    db.commit()
    
    # Check low stock notification
    check_low_stock(db, inv.product_id, inv.warehouse_id, inv.stock, inv.minimum_stock)
    
    log_activity(db, "STOCK_ADJUSTMENT", f"Adjusted stock for product {adj.product_id} in warehouse {adj.warehouse_id}. New stock: {adj.stock}, Damaged: {adj.damaged_stock}", current_user.get("id"))
    return {"message": "Inventory adjusted successfully"}

@router.get("/stock-movements", response_model=List[schemas.StockMovementOut])
def get_stock_movements(
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.admin_only)
):
    query = db.query(models.StockMovement)
    if product_id:
        query = query.filter(models.StockMovement.product_id == product_id)
    if warehouse_id:
        query = query.filter(
            (models.StockMovement.from_warehouse_id == warehouse_id) | 
            (models.StockMovement.to_warehouse_id == warehouse_id)
        )
    return query.order_by(models.StockMovement.created_at.desc()).all()

# =================================================
# SUPPLIERS ENDPOINTS
# =================================================

@router.get("/suppliers", response_model=List[schemas.SupplierOut])
def get_suppliers(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Supplier).all()

@router.post("/suppliers", response_model=schemas.SupplierOut)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    new_supp = models.Supplier(
        name=supplier.name,
        email=supplier.email,
        phone=supplier.phone,
        address=supplier.address,
        company=supplier.company
    )
    db.add(new_supp)
    db.commit()
    db.refresh(new_supp)
    
    log_activity(db, "CREATE_SUPPLIER", f"Created supplier: {new_supp.name} ({new_supp.company or 'No Company'})", current_user.get("id"))
    return new_supp

@router.put("/suppliers/{id}", response_model=schemas.SupplierOut)
def update_supplier(id: int, supplier: schemas.SupplierUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    supp = db.query(models.Supplier).filter(models.Supplier.id == id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    supp.name = supplier.name
    supp.email = supplier.email
    supp.phone = supplier.phone
    supp.address = supplier.address
    supp.company = supplier.company
    
    db.commit()
    db.refresh(supp)
    
    log_activity(db, "UPDATE_SUPPLIER", f"Updated supplier ID {id}: {supp.name}", current_user.get("id"))
    return supp

@router.delete("/suppliers/{id}")
def delete_supplier(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    supp = db.query(models.Supplier).filter(models.Supplier.id == id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    db.delete(supp)
    db.commit()
    
    log_activity(db, "DELETE_SUPPLIER", f"Deleted supplier ID {id}", current_user.get("id"))
    return {"message": "Supplier deleted successfully"}

# =================================================
# CUSTOMERS ENDPOINTS
# =================================================

@router.get("/customers", response_model=List[schemas.CustomerOut])
def get_customers(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Customer).all()

@router.post("/customers", response_model=schemas.CustomerOut)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    new_cust = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address,
        pending_payment=customer.pending_payment or 0.0
    )
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    
    log_activity(db, "CREATE_CUSTOMER", f"Created customer: {new_cust.name}", current_user.get("id"))
    return new_cust

@router.put("/customers/{id}", response_model=schemas.CustomerOut)
def update_customer(id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    cust = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    cust.name = customer.name
    cust.email = customer.email
    cust.phone = customer.phone
    cust.address = customer.address
    cust.pending_payment = customer.pending_payment
    
    db.commit()
    db.refresh(cust)
    
    log_activity(db, "UPDATE_CUSTOMER", f"Updated customer ID {id}: {cust.name}", current_user.get("id"))
    return cust

@router.delete("/customers/{id}")
def delete_customer(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    cust = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db.delete(cust)
    db.commit()
    
    log_activity(db, "DELETE_CUSTOMER", f"Deleted customer ID {id}", current_user.get("id"))
    return {"message": "Customer deleted successfully"}

# =================================================
# PURCHASES ENDPOINTS
# =================================================

@router.get("/purchases", response_model=List[schemas.PurchaseOut])
def get_purchases(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Purchase).order_by(models.Purchase.purchase_date.desc()).all()

@router.get("/purchases/{id}", response_model=schemas.PurchaseOut)
def get_purchase(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    purchase = db.query(models.Purchase).filter(models.Purchase.id == id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase

@router.post("/purchases", response_model=schemas.PurchaseOut)
def create_purchase(purchase_in: schemas.PurchaseCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    # Verify invoice_number unique
    exists = db.query(models.Purchase).filter(models.Purchase.invoice_number == purchase_in.invoice_number).first()
    if exists:
        raise HTTPException(status_code=400, detail="Purchase invoice number already exists")
        
    # Verify warehouse exists
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == purchase_in.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    # Calculate sum of items
    calculated_subtotal = 0.0
    for item in purchase_in.items:
        calculated_subtotal += (item.quantity * item.unit_price)
        
    total_amount = calculated_subtotal + purchase_in.tax_amount
    
    new_purchase = models.Purchase(
        supplier_id=purchase_in.supplier_id,
        warehouse_id=purchase_in.warehouse_id,
        invoice_number=purchase_in.invoice_number,
        total_amount=total_amount,
        tax_amount=purchase_in.tax_amount,
        status=purchase_in.status or "completed",
        purchase_date=datetime.utcnow()
    )
    db.add(new_purchase)
    db.commit() # Save purchase first to get ID
    db.refresh(new_purchase)
    
    # Process items and update stocks
    for item in purchase_in.items:
        # Create purchase item
        item_total = item.quantity * item.unit_price
        p_item = models.PurchaseItem(
            purchase_id=new_purchase.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total
        )
        db.add(p_item)
        
        # Auto stock update
        inv = db.query(models.Inventory).filter(
            models.Inventory.product_id == item.product_id,
            models.Inventory.warehouse_id == purchase_in.warehouse_id
        ).first()
        
        if not inv:
            inv = models.Inventory(
                product_id=item.product_id,
                warehouse_id=purchase_in.warehouse_id,
                stock=0,
                minimum_stock=100,
                damaged_stock=0
            )
            db.add(inv)
            
        inv.stock += item.quantity
        
        # Update product's purchase price & total quantity
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.purchase_price = item.unit_price # Update product cost price to latest
            
            # Recalculate total product quantity
            # Wait, let's recalculate or update directly. We can commit the inventory change, then query sum.
            
        # Log Stock Movement
        mov = models.StockMovement(
            product_id=item.product_id,
            quantity=item.quantity,
            type="purchase",
            from_warehouse_id=None,
            to_warehouse_id=purchase_in.warehouse_id,
            description=f"Purchased stock under invoice: {purchase_in.invoice_number}"
        )
        db.add(mov)
        
    db.commit()
    db.refresh(new_purchase)
    
    # Recalculate all products total quantities
    for item in purchase_in.items:
        total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.product_id == item.product_id).scalar() or 0
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity = total_stock
    db.commit()
    
    # Auto-generate Invoice record
    invoice = models.Invoice(
        purchase_id=new_purchase.id,
        invoice_number=purchase_in.invoice_number,
        invoice_type="purchase",
        issue_date=datetime.utcnow(),
        total_amount=total_amount,
        status="paid" if purchase_in.status == "completed" else "pending"
    )
    db.add(invoice)
    db.commit()
    
    log_activity(db, "CREATE_PURCHASE", f"Created purchase invoice {new_purchase.invoice_number} (Amount: {total_amount})", current_user.get("id"))
    return new_purchase

# =================================================
# SALES ENDPOINTS
# =================================================

@router.get("/sales", response_model=List[schemas.SaleOut])
def get_sales(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Sale).order_by(models.Sale.sale_date.desc()).all()

@router.get("/sales/{id}", response_model=schemas.SaleOut)
def get_sale(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    sale = db.query(models.Sale).filter(models.Sale.id == id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.delete("/sales/{id}")
def delete_sale(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    sale = db.query(models.Sale).filter(models.Sale.id == id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    warehouse_id = sale.warehouse_id
    restored_products = set()

    for item in sale.items:
        inv = db.query(models.Inventory).filter(
            models.Inventory.product_id == item.product_id,
            models.Inventory.warehouse_id == warehouse_id
        ).first()
        if inv:
            inv.stock += item.quantity
            restored_products.add(item.product_id)

        move = models.StockMovement(
            product_id=item.product_id,
            quantity=item.quantity,
            type="sale_cancellation",
            from_warehouse_id=None,
            to_warehouse_id=warehouse_id,
            description=f"Restored {item.quantity} units from deleted sale {sale.invoice_number}"
        )
        db.add(move)

    invoices = db.query(models.Invoice).filter(models.Invoice.sale_id == sale.id).all()
    for invoice in invoices:
        db.delete(invoice)

    db.delete(sale)
    db.commit()

    for product_id in restored_products:
        total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.product_id == product_id).scalar() or 0
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if product:
            product.quantity = total_stock
    db.commit()

    log_activity(db, "DELETE_SALE", f"Deleted sale invoice {sale.invoice_number} and restored stock", current_user.get("id"))
    return {"message": "Sale record deleted and stock restored successfully"}

@router.post("/sales", response_model=schemas.SaleOut)
def create_sale(sale_in: schemas.SaleCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    # Verify invoice_number unique
    exists = db.query(models.Sale).filter(models.Sale.invoice_number == sale_in.invoice_number).first()
    if exists:
        raise HTTPException(status_code=400, detail="Sales invoice number already exists")
        
    # Verify warehouse exists
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == sale_in.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    # 1. First Pass: Validate that there is enough stock for all items
    for item in sale_in.items:
        inv = db.query(models.Inventory).filter(
            models.Inventory.product_id == item.product_id,
            models.Inventory.warehouse_id == sale_in.warehouse_id
        ).first()
        
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        prod_name = product.name if product else f"Product ID {item.product_id}"
        
        if not inv or inv.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {prod_name} in {warehouse.name}. Available: {inv.stock if inv else 0}, Requested: {item.quantity}"
            )
            
    # Calculate sum, profit
    calculated_subtotal = 0.0
    total_profit = 0.0
    
    for item in sale_in.items:
        calculated_subtotal += (item.quantity * item.unit_price)
        
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        cost_price = product.purchase_price if product else 0.0
        profit_per_unit = item.unit_price - cost_price
        total_profit += (item.quantity * profit_per_unit)
        
    total_amount = calculated_subtotal + sale_in.tax_amount
    
    new_sale = models.Sale(
        customer_id=sale_in.customer_id,
        warehouse_id=sale_in.warehouse_id,
        invoice_number=sale_in.invoice_number,
        total_amount=total_amount,
        tax_amount=sale_in.tax_amount,
        profit=total_profit,
        status=sale_in.status or "completed",
        sale_date=datetime.utcnow()
    )
    db.add(new_sale)
    db.commit() # Save sale first to get ID
    db.refresh(new_sale)
    
    # Process items and deduct stocks
    for item in sale_in.items:
        # Create sale item
        item_total = item.quantity * item.unit_price
        s_item = models.SaleItem(
            sale_id=new_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total
        )
        db.add(s_item)
        
        # Deduct stock
        inv = db.query(models.Inventory).filter(
            models.Inventory.product_id == item.product_id,
            models.Inventory.warehouse_id == sale_in.warehouse_id
        ).first()
        inv.stock -= item.quantity
        
        # Log Stock Movement
        mov = models.StockMovement(
            product_id=item.product_id,
            quantity=-item.quantity,
            type="sale",
            from_warehouse_id=sale_in.warehouse_id,
            to_warehouse_id=None,
            description=f"Sold stock under invoice: {sale_in.invoice_number}"
        )
        db.add(mov)
        
    db.commit()
    db.refresh(new_sale)
    
    # Recalculate products total quantities and check low stocks
    for item in sale_in.items:
        total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.product_id == item.product_id).scalar() or 0
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity = total_stock
            
        inv = db.query(models.Inventory).filter(
            models.Inventory.product_id == item.product_id,
            models.Inventory.warehouse_id == sale_in.warehouse_id
        ).first()
        check_low_stock(db, item.product_id, sale_in.warehouse_id, inv.stock, inv.minimum_stock)
        
    db.commit()
    
    # Auto-generate Invoice record
    invoice = models.Invoice(
        sale_id=new_sale.id,
        invoice_number=sale_in.invoice_number,
        invoice_type="sale",
        issue_date=datetime.utcnow(),
        total_amount=total_amount,
        status="paid" if sale_in.status == "completed" else "pending"
    )
    db.add(invoice)
    db.commit()
    
    log_activity(db, "CREATE_SALE", f"Created sales invoice {new_sale.invoice_number} (Amount: {total_amount}, Profit: {total_profit})", current_user.get("id"))
    return new_sale

# =================================================
# REPORTS ENDPOINTS
# =================================================

@router.get("/dashboard")
@router.get("/reports/dashboard")
def get_dashboard_data(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    total_products = db.query(models.Product).count()
    total_sales = db.query(models.Sale).filter(models.Sale.status == "completed").count()
    total_purchases = db.query(models.Purchase).filter(models.Purchase.status == "completed").count()
    total_warehouses = db.query(models.Warehouse).count()
    
    # Low stock alerts (items in inventory where stock <= minimum_stock)
    low_stock_items = db.query(models.Inventory).filter(models.Inventory.stock <= models.Inventory.minimum_stock).all()
    low_stock_count = len(low_stock_items)
    
    # Monthly Revenue (sales total amount summed up)
    sales_amount = db.query(func.sum(models.Sale.total_amount)).filter(models.Sale.status == "completed").scalar() or 0.0
    purchase_amount = db.query(func.sum(models.Purchase.total_amount)).filter(models.Purchase.status == "completed").scalar() or 0.0
    profit_amount = db.query(func.sum(models.Sale.profit)).filter(models.Sale.status == "completed").scalar() or 0.0
    
    # Get last 10 activities
    recent_activities = db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc()).limit(10).all()
    
    # Monthly sales analytics (past 6 months)
    # Return mock/calculated chart data for the line chart
    chart_data = []
    today = datetime.utcnow()
    for i in range(5, -1, -1):
        month_start = today - timedelta(days=30*i)
        month_start = month_start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            month_end = today - timedelta(days=30*(i-1))
            month_end = month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            month_end = today + timedelta(days=1)
            
        m_sales = db.query(func.sum(models.Sale.total_amount)).filter(
            models.Sale.sale_date >= month_start,
            models.Sale.sale_date < month_end,
            models.Sale.status == "completed"
        ).scalar() or 0.0
        
        m_purchases = db.query(func.sum(models.Purchase.total_amount)).filter(
            models.Purchase.purchase_date >= month_start,
            models.Purchase.purchase_date < month_end,
            models.Purchase.status == "completed"
        ).scalar() or 0.0
        
        chart_data.append({
            "month": month_start.strftime("%B"),
            "sales": m_sales,
            "purchases": m_purchases
        })
        
    # Inventory Valuation
    # Sum of (Product quantity * product.purchase_price)
    valuation = 0.0
    products = db.query(models.Product).all()
    for p in products:
        valuation += (p.quantity * p.purchase_price)
        
    return {
        "summary": {
            "total_products": total_products,
            "total_sales": total_sales,
            "total_purchases": total_purchases,
            "total_warehouses": total_warehouses,
            "low_stock_count": low_stock_count,
            "total_revenue": sales_amount,
            "total_expense": purchase_amount,
            "total_profit": profit_amount,
            "inventory_valuation": valuation
        },
        "recent_activities": [
            {
                "id": act.id,
                "action": act.action,
                "details": act.details,
                "created_at": act.created_at
            } for act in recent_activities
        ],
        "sales_analytics": chart_data
    }

@router.get("/reports/inventory")
def get_inventory_report(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    # Details per product showing its category, stock, purchase price, selling price, and total valuation
    products = db.query(models.Product).all()
    report = []
    for p in products:
        report.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category.name if p.category else "Uncategorized",
            "stock": p.quantity,
            "purchase_price": p.purchase_price,
            "selling_price": p.price,
            "valuation": p.quantity * p.purchase_price,
            "status": p.status
        })
    return report

@router.get("/reports/warehouses")
def get_warehouse_report(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    warehouses = db.query(models.Warehouse).all()
    report = []
    for w in warehouses:
        # Sum current stock in this warehouse
        total_stock = db.query(func.sum(models.Inventory.stock)).filter(models.Inventory.warehouse_id == w.id).scalar() or 0
        utilization = (total_stock / w.capacity * 100) if w.capacity > 0 else 0.0
        
        report.append({
            "id": w.id,
            "name": w.name,
            "location": w.location,
            "capacity": w.capacity,
            "current_stock": total_stock,
            "utilization": round(utilization, 2),
            "status": w.status
        })
    return report

# =================================================
# NOTIFICATIONS ENDPOINTS
# =================================================

@router.get("/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()

@router.put("/notifications/{id}/read")
def mark_notification_read(id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    notification = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    db.query(models.Notification).filter(models.Notification.is_read == False).update({
        models.Notification.is_read: True
    }, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

# =================================================
# ACTIVITY LOGS / AUDIT ENDPOINTS
# =================================================

@router.get("/activity-logs", response_model=List[schemas.ActivityLogOut])
def get_activity_logs(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc()).all()

# =================================================
# INVOICES ENDPOINTS
# =================================================

@router.get("/invoices", response_model=List[schemas.InvoiceOut])
def get_invoices(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    return db.query(models.Invoice).order_by(models.Invoice.issue_date.desc()).all()

# =================================================
# DATA BACKUP
# =================================================

@router.post("/backup")
def backup_database(db: Session = Depends(get_db), current_user: dict = Depends(auth.admin_only)):
    # If SQLite, copy inventory.db to backup
    # If PostgreSQL, can output confirmation or export tables as JSON
    import json
    
    backup_data = {}
    
    # Export key tables as JSON
    for model_cls, name in [
        (models.User, "users"),
        (models.Category, "categories"),
        (models.Product, "products"),
        (models.Warehouse, "warehouses"),
        (models.Inventory, "inventory"),
        (models.Supplier, "suppliers"),
        (models.Customer, "customers"),
        (models.Purchase, "purchases"),
        (models.PurchaseItem, "purchase_items"),
        (models.Sale, "sales"),
        (models.SaleItem, "sale_items"),
        (models.StockMovement, "stock_movements"),
        (models.Invoice, "invoices"),
        (models.Notification, "notifications"),
        (models.ActivityLog, "activity_logs")
    ]:
        records = db.query(model_cls).all()
        table_records = []
        for r in records:
            dict_rec = {}
            for col in r.__table__.columns:
                val = getattr(r, col.name)
                if isinstance(val, datetime):
                    val = val.isoformat()
                dict_rec[col.name] = val
            table_records.append(dict_rec)
        backup_data[name] = table_records
        
    os.makedirs("static/backups", exist_ok=True)
    backup_file = f"static/backups/backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
    with open(backup_file, "w") as f:
        json.dump(backup_data, f, indent=4)
        
    log_activity(db, "BACKUP", f"Database backed up to file: {backup_file}", current_user.get("id"))
    return {"message": "Backup created successfully", "file": backup_file}
