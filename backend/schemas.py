from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# =================================================
# USER
# =================================================
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

# =================================================
# CATEGORIES
# =================================================
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# =================================================
# PRODUCTS
# =================================================
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    price: float
    purchase_price: Optional[float] = 0.0
    quantity: Optional[int] = 0
    image: Optional[str] = None
    status: Optional[str] = "active"
    category_id: int

class ProductUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    price: float
    purchase_price: float
    quantity: int
    image: Optional[str] = None
    status: str
    category_id: int

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    price: float
    purchase_price: float
    quantity: int
    image: Optional[str] = None
    status: str
    category_id: int
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True

# =================================================
# WAREHOUSES
# =================================================
class WarehouseCreate(BaseModel):
    name: str
    location: str
    manager: Optional[str] = None
    capacity: int
    status: Optional[str] = "active"

class WarehouseUpdate(BaseModel):
    name: str
    location: str
    manager: Optional[str] = None
    capacity: int
    status: str

class WarehouseOut(BaseModel):
    id: int
    name: str
    location: str
    manager: Optional[str] = None
    capacity: int
    status: str

    class Config:
        from_attributes = True

# =================================================
# INVENTORY
# =================================================
class InventoryCreate(BaseModel):
    product_id: int
    warehouse_id: int
    stock: int
    minimum_stock: Optional[int] = 100
    damaged_stock: Optional[int] = 0

class InventoryUpdate(BaseModel):
    stock: int
    minimum_stock: int
    damaged_stock: int

class InventoryOut(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    stock: int
    minimum_stock: int
    damaged_stock: int
    product: Optional[ProductOut] = None
    warehouse: Optional[WarehouseOut] = None

    class Config:
        from_attributes = True

class WarehouseTransfer(BaseModel):
    product_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: int

class InventoryAdjustment(BaseModel):
    product_id: int
    warehouse_id: int
    stock: int
    damaged_stock: int
    description: Optional[str] = None

# =================================================
# SUPPLIERS
# =================================================
class SupplierCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None

class SupplierUpdate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None

class SupplierOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None

    class Config:
        from_attributes = True

# =================================================
# CUSTOMERS
# =================================================
class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pending_payment: Optional[float] = 0.0

class CustomerUpdate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pending_payment: float

class CustomerOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pending_payment: float

    class Config:
        from_attributes = True

# =================================================
# ITEMS (PURCHASES AND SALES)
# =================================================
class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class PurchaseItemOut(BaseModel):
    id: int
    purchase_id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class SaleItemOut(BaseModel):
    id: int
    sale_id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

# =================================================
# PURCHASES
# =================================================
class PurchaseCreate(BaseModel):
    supplier_id: int
    warehouse_id: int
    invoice_number: str
    tax_amount: Optional[float] = 0.0
    status: Optional[str] = "completed"
    items: List[PurchaseItemCreate]

class PurchaseOut(BaseModel):
    id: int
    supplier_id: int
    warehouse_id: Optional[int] = None
    purchase_date: datetime
    invoice_number: str
    total_amount: float
    tax_amount: float
    status: str
    supplier: Optional[SupplierOut] = None
    warehouse: Optional[WarehouseOut] = None
    items: List[PurchaseItemOut] = []

    class Config:
        from_attributes = True

# =================================================
# SALES
# =================================================
class SaleCreate(BaseModel):
    customer_id: int
    warehouse_id: int
    invoice_number: str
    tax_amount: Optional[float] = 0.0
    status: Optional[str] = "completed"
    items: List[SaleItemCreate]

class SaleOut(BaseModel):
    id: int
    customer_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    sale_date: datetime
    invoice_number: str
    total_amount: float
    tax_amount: float
    profit: float
    status: str
    customer: Optional[CustomerOut] = None
    warehouse: Optional[WarehouseOut] = None
    items: List[SaleItemOut] = []

    class Config:
        from_attributes = True

# =================================================
# STOCK MOVEMENTS
# =================================================
class StockMovementOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    type: str
    from_warehouse_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime
    product: Optional[ProductOut] = None
    from_warehouse: Optional[WarehouseOut] = None
    to_warehouse: Optional[WarehouseOut] = None

    class Config:
        from_attributes = True

# =================================================
# INVOICES
# =================================================
class InvoiceOut(BaseModel):
    id: int
    sale_id: Optional[int] = None
    purchase_id: Optional[int] = None
    invoice_number: str
    invoice_type: str
    issue_date: datetime
    total_amount: float
    pdf_path: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# =================================================
# NOTIFICATIONS
# =================================================
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# =================================================
# ACTIVITY LOGS
# =================================================
class ActivityLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True