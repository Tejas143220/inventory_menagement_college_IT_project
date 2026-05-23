from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
try:
    from .database import Base
except ImportError:
    from database import Base

# =================================================
# USERS
# =================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="admin")  # Only "admin" role will be supported

# =================================================
# CATEGORIES
# =================================================
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")

# =================================================
# PRODUCTS
# =================================================
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    sku = Column(String, unique=True, index=True)
    barcode = Column(String, nullable=True, index=True)
    price = Column(Float)  # Selling price
    purchase_price = Column(Float, default=0.0)  # Cost price for profit calculation
    quantity = Column(Integer, default=0)  # Total stock across all warehouses
    image = Column(String, nullable=True)
    status = Column(String, default="active")  # active, inactive
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")

# =================================================
# WAREHOUSES
# =================================================
class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    manager = Column(String, nullable=True)
    capacity = Column(Integer)  # Maximum physical bricks
    status = Column(String, default="active")  # active, inactive

    inventory = relationship("Inventory", back_populates="warehouse", cascade="all, delete-orphan")

# =================================================
# INVENTORY
# =================================================
class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    stock = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=100)
    damaged_stock = Column(Integer, default=0)

    product = relationship("Product", back_populates="inventory")
    warehouse = relationship("Warehouse", back_populates="inventory")

# =================================================
# SUPPLIERS
# =================================================
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    company = Column(String, nullable=True)

    purchases = relationship("Purchase", back_populates="supplier")

# =================================================
# CUSTOMERS
# =================================================
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    pending_payment = Column(Float, default=0.0)

    sales = relationship("Sale", back_populates="customer")

# =================================================
# PURCHASES
# =================================================
class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    invoice_number = Column(String, unique=True, index=True)
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)  # GST/Tax
    status = Column(String, default="completed")  # completed, pending, cancelled

    supplier = relationship("Supplier", back_populates="purchases")
    warehouse = relationship("Warehouse")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="purchase", cascade="all, delete-orphan")

# =================================================
# PURCHASE ITEMS
# =================================================
class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product")

# =================================================
# SALES
# =================================================
class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    sale_date = Column(DateTime, default=datetime.utcnow)
    invoice_number = Column(String, unique=True, index=True)
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)  # GST/Tax
    profit = Column(Float, default=0.0)
    status = Column(String, default="completed")  # completed, pending, cancelled

    customer = relationship("Customer", back_populates="sales")
    warehouse = relationship("Warehouse")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="sale", cascade="all, delete-orphan")

# =================================================
# SALE ITEMS
# =================================================
class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")

# =================================================
# STOCK MOVEMENTS
# =================================================
class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    type = Column(String)  # purchase, sale, transfer, adjustment
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])

# =================================================
# INVOICES
# =================================================
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    invoice_number = Column(String, unique=True, index=True)
    invoice_type = Column(String)  # sale, purchase
    issue_date = Column(DateTime, default=datetime.utcnow)
    total_amount = Column(Float)
    pdf_path = Column(String, nullable=True)
    status = Column(String, default="paid")  # paid, unpaid, pending

    sale = relationship("Sale", back_populates="invoices")
    purchase = relationship("Purchase", back_populates="invoices")

# =================================================
# NOTIFICATIONS
# =================================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(String)
    type = Column(String, default="info")  # low_stock, info, warning
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# =================================================
# ACTIVITY LOGS
# =================================================
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")