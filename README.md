# 🚀 Next-Gen Backend Automation Platform

> **Schema → API in seconds.** Generate production-ready FastAPI backends from JSON schemas, forms, or plain English prompts.

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **Auto CRUD Generation** | Define a schema → get 5 REST endpoints instantly |
| 🧠 **AI-Powered Generation** | Describe your backend in English → AI builds the schema |
| 🔐 **JWT Auth + RBAC** | Built-in signup/login with admin/user/viewer roles |
| 🗄️ **Dual Database** | PostgreSQL (SQLAlchemy) + MongoDB (Motor) support |
| 📊 **Admin Dashboard** | Test APIs, monitor stats, manage schemas — all in-browser |
| ⚙️ **Production Middleware** | Rate limiting, structured logging, global error handling |
| 📄 **Auto API Docs** | Swagger UI auto-generated from Pydantic models |
| 🐳 **Docker Ready** | One command to spin up the entire stack |

---

## 🏗️ Architecture

```
User Input (JSON / Form / English Prompt)
         │
         ▼
   ┌───────────────┐
   │ Schema Parser  │  ← Normalizes all input formats
   │ + AI Engine    │  ← LLM or rule-based fallback
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Code Generator │  ← SQLAlchemy + Pydantic models
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Route Builder  │  ← Mounts CRUD on live app
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │  Live APIs     │  ← Immediately usable + documented
   └───────────────┘
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start everything
cp .env.example .env
docker-compose up --build
```

Visit:
- **Dashboard**: http://localhost:8000/dashboard
- **API Docs**: http://localhost:8000/docs

### Option 2: Local Development

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

> **Note:** You need PostgreSQL, MongoDB, and Redis running locally, or update `.env` with your connection strings.

---

## 📖 Usage Examples

### 1. Generate API from JSON Schema

```bash
curl -X POST http://localhost:8000/api/v1/schemas/from-json \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product",
    "fields": {
      "title": {"type": "string", "required": true, "max_length": 200},
      "price": {"type": "float", "min": 0},
      "sku": {"type": "string", "unique": true}
    },
    "db_type": "postgresql"
  }'
```

**Result:** 5 CRUD endpoints created at `/api/v1/products`

### 2. Generate API from AI Prompt

```bash
curl -X POST http://localhost:8000/api/v1/schemas/from-prompt \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a user system with login, signup and roles",
    "db_type": "postgresql"
  }'
```

### 3. Use the Dashboard

Navigate to `http://localhost:8000/dashboard` to:
- Build schemas visually with the form builder
- Test generated APIs with the built-in API tester
- Monitor system health and manage schemas

---

## 📁 Project Structure

```
Backend-automate/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Environment settings
│   ├── core/                # ⚡ Engine
│   │   ├── schema_parser.py # Input normalization
│   │   ├── ai_engine.py     # LLM prompt → schema
│   │   ├── code_generator.py# Model & schema codegen
│   │   └── route_builder.py # Dynamic CRUD mounting
│   ├── api/                 # 🌐 Routes
│   │   ├── auth.py          # JWT auth endpoints
│   │   ├── schemas.py       # Schema management
│   │   └── admin.py         # Admin dashboard API
│   ├── models/              # 🗄️ Database models
│   ├── schemas/             # 📋 Pydantic schemas
│   ├── auth/                # 🔐 JWT + RBAC
│   ├── middleware/           # ⚙️ Rate limit, logging, errors
│   ├── db/                  # 🔌 DB connections
│   └── dashboard/           # 📊 Frontend UI
├── tests/                   # ✅ Test suite
├── docker-compose.yml       # 🐳 Full stack
└── requirements.txt
```

---

## 🔐 Authentication Flow

1. **Sign Up**: `POST /api/v1/auth/signup` → creates user
2. **Login**: `POST /api/v1/auth/login` → returns JWT tokens
3. **Use Token**: Add `Authorization: Bearer <token>` header
4. **Refresh**: `POST /api/v1/auth/refresh` → new access token

### Roles
| Role | Access |
|------|--------|
| `admin` | Full access + user management |
| `user` | Create schemas, use generated APIs |
| `viewer` | Read-only access |

---

## ⚙️ Configuration

All settings are in `.env` (copy from `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET_KEY` | Token signing key | *change this!* |
| `POSTGRES_URL` | PostgreSQL connection | `localhost:5432` |
| `MONGODB_URL` | MongoDB connection | `localhost:27017` |
| `REDIS_URL` | Redis connection | `localhost:6379` |
| `OPENAI_API_KEY` | For AI generation | *optional* |
| `RATE_LIMIT_PER_MINUTE` | Max requests/min | `60` |

---

## 🧪 Running Tests

```bash
pip install pytest pytest-asyncio
pytest tests/ -v
```

---

## 📜 License

MIT License — build whatever you want with it.
