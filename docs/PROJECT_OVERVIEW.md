Inventory Management — Project Overview & Quick Start

Purpose

This repository implements an inventory and warehouse management application (Fly Ash Bricks ERP) with a FastAPI backend and a Next.js frontend. It provides CRUD management for products, categories, warehouses, inventory, suppliers, customers, purchases, sales, invoices, and reports.

Technologies Used

- Backend: Python, FastAPI, SQLAlchemy, Pydantic (v2), Uvicorn
- Database: SQLite (dev fallback) and PostgreSQL (production-ready)
- Frontend: Next.js (App Router), React, Tailwind CSS, Chart.js
- HTTP client: axios (frontend)
- Optional: psycopg2-binary for Postgres, python-multipart for file uploads

High-level Architecture

- Frontend (Next.js) is a client for administrators. It calls REST endpoints on the backend and renders dashboards, forms, and reports.
- Backend (FastAPI) exposes a single router (`backend/routes.py`) which contains business logic and validation (using `backend/schemas.py`).
- SQLAlchemy models (`backend/models.py`) map the relational schema. The backend updates `StockMovement`, `Inventory`, and `Product.quantity` together to keep inventory consistent.
- Files (product images, backups) are stored under `backend/static/uploads` and `backend/static/backups`.

How the App Works (Flow)

1. Admin logs in via the frontend; frontend stores a bearer token returned by `/login` and attaches it to further requests.
2. Admin creates categories/products/warehouses via frontend forms → frontend sends POST requests to backend endpoints.
3. When a purchase is created (`POST /purchases`) the backend:
   - Creates `Purchase` and `PurchaseItem` records
   - Updates or creates `Inventory` rows for the warehouse
   - Adds `StockMovement` entries
   - Recalculates `Product.quantity` across warehouses
   - Optionally creates an `Invoice` record
4. When a sale is created (`POST /sales`) the backend validates stock availability, deducts inventory, writes `SaleItem`, logs `StockMovement`, recalculates product totals, and creates invoices.
5. Deleting a purchase or sale reverses inventory changes where possible and removes associated invoices.

Running Locally (Quick)

Backend (from repository root):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt  # if present; otherwise install FastAPI, Uvicorn, SQLAlchemy, pydantic
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

Environment Variables (Postgres mode)

Set all of these to enable PostgreSQL. If any are missing the code will default to a local SQLite DB:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Optionally `DATABASE_URL` can override

Key Files to Inspect

- `backend/main.py` — FastAPI app and startup
- `backend/routes.py` — all API endpoints and business logic
- `backend/models.py` — SQLAlchemy models and relations
- `backend/schemas.py` — validation models
- `backend/database.py` — DB selection and engine
- `frontend/app` — Next.js pages
- `frontend/components` — shared components and forms
- `frontend/services/api.js` — axios wrapper used by the UI

API Notes

- FastAPI exposes OpenAPI docs at `/docs` and `/redoc` when running.
- Authentication: simple token generation in `auth.py` used by protected endpoints via dependency `auth.admin_only`.
- Important endpoints: `/products`, `/inventory`, `/purchases`, `/sales`, `/reports/*`, `/backup`

Testing & Validation

- Use the `/health` endpoint to confirm backend is running.
- Test login → save bearer token → call protected endpoints.
- Validate inventory operations with sequential purchases and sales to observe `StockMovement` and `Inventory` changes.

Production Recommendations

- Use PostgreSQL behind a secure network instead of SQLite for concurrency and data durability.
- Add Alembic for migrations; switch away from `Base.metadata.create_all` for production.
- Containerize the app and database with `docker-compose` for reproducible deployments.
- Add a `requirements.txt` and CI job to run tests/linting and to build the frontend.

Next Steps I can do for you

- Produce an expanded API reference with request/response examples and JSON schemas.
- Export Mermaid diagrams to images and store them under `docs/diagrams/`.
- Create `requirements.txt` and a `docker-compose.yml` for a PostgreSQL setup.

File created: `docs/PROJECT_OVERVIEW.md`
