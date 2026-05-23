import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure backend package directory is on sys.path so imports work
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import (
    engine,
    Base
)
from routes import router

# =================================================
# PRE-START INITIALIZATION
# =================================================
# Ensure upload and backup directories exist
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/backups", exist_ok=True)

# =================================================
# CREATE DATABASE TABLES
# =================================================
Base.metadata.create_all(bind=engine)

# =================================================
# FASTAPI APP
# =================================================
app = FastAPI(
    title="Fly Ash Bricks ERP API",
    description="Enterprise Inventory & Warehouse Backend using FastAPI",
    version="2.0.0"
)

# =================================================
# CORS CONFIGURATION
# =================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================
# MOUNT STATIC FILES
# =================================================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =================================================
# INCLUDE ROUTES
# =================================================
app.include_router(router)

# =================================================
# HOME ROUTE
# =================================================
@app.get("/")
def home():
    return {
        "message": "Fly Ash Bricks ERP Backend Running Successfully",
        "version": "2.0.0"
    }

# =================================================
# HEALTH CHECK API
# =================================================
@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "server": "Running"
    }