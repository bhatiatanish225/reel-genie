# Reel Genie Backend - Project Summary

## Overview

A production-ready FastAPI backend for AI-powered Instagram reel generation and auto-posting. The system handles the complete pipeline from prompt to published reel, including script generation, voiceover synthesis, video assembly, thumbnail selection, and Instagram publishing.

## Architecture

### High-Level Flow

```
User Request → FastAPI → Celery Queue → Worker Pipeline → S3 Storage → Instagram API
                ↓                                                              ↓
            PostgreSQL ← Analytics ← Status Updates ← SSE Stream ← Frontend
```

### Components

1. **FastAPI Application** (`app/main.py`)
   - REST API with OpenAPI documentation
   - JWT authentication
   - Request validation with Pydantic
   - Error handling and logging
   - CORS middleware

2. **Database Layer** (`app/models/`, `app/db/`)
   - PostgreSQL with SQLAlchemy ORM
   - Models: User, Reel, Analytics, Task
   - Alembic migrations
   - Connection pooling

3. **Task Queue** (`app/tasks/`)
   - Celery with Redis broker
   - Generation pipeline task
   - Publishing task
   - Scheduled daily autopost
   - Retry logic with exponential backoff

4. **Services** (`app/services/`)
   - **LLMService**: OpenAI GPT-4o script generation
   - **TTSService**: ElevenLabs voice synthesis
   - **VideoService**: Pexels stock footage + MoviePy assembly
   - **ThumbnailService**: OpenCV-based frame selection
   - **StorageService**: S3 upload/download
   - **InstagramService**: Graph API publishing

5. **API Endpoints** (`app/api/v1/endpoints/`)
   - Authentication (login, refresh)
   - Reels CRUD (create, list, detail, retry, cancel, publish)
   - Batch operations
   - Analytics
   - Uploads
   - Health checks
   - SSE streaming

## Key Features Implemented

### ✅ Core Functionality

- [x] JWT-based authentication with refresh tokens
- [x] Single reel creation with validation
- [x] Batch reel creation (max 10 items)
- [x] Async generation pipeline with Celery
- [x] AI script generation with GPT-4o
- [x] Text-to-speech with ElevenLabs
- [x] Stock footage fetching from Pexels
- [x] Video assembly with MoviePy
- [x] Smart thumbnail selection (face detection, sharpness, composition)
- [x] S3 media storage
- [x] Instagram Graph API publishing
- [x] Scheduled publishing with Celery Beat
- [x] Real-time updates via SSE
- [x] Analytics tracking and aggregation
- [x] File uploads (multipart)
- [x] Health checks for all services

### ✅ API Contract Compliance

All endpoints match the specification exactly:

- **POST /v1/auth/login** - Returns access_token, token_type, expires_in, user
- **POST /v1/auth/refresh** - Token refresh
- **POST /v1/reels** - Returns id, status, created_at, scheduled_time, estimated_time_seconds, links
- **POST /v1/reels/batch** - Returns batch_id, created_count, items
- **GET /v1/reels/{id}** - Returns full reel details with logs
- **GET /v1/reels** - Paginated list with filtering
- **POST /v1/reels/{id}/retry** - 202 response
- **POST /v1/reels/{id}/cancel** - 200 response, 409 if posted
- **POST /v1/reels/{id}/publish** - Returns id, status, ig_task_id
- **POST /v1/uploads** - Returns upload_id, file_url
- **GET /v1/analytics** - Returns metrics, timeseries, top_hashtags
- **GET /v1/reels/stream** - SSE events (reel.status_update, reel.log)
- **GET /v1/health** - Returns status, services

### ✅ Error Handling

Consistent error format across all endpoints:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human readable message",
    "details": {"field": "error detail"}
  }
}
```

### ✅ Status Transitions

Proper state machine for reels:
- created → queued → generating → ready → scheduled → posting → posted
- Failed states handled with retry capability
- Cancelled state for user-initiated cancellation

### ✅ Validation

- Duration must be 15, 30, or 60 seconds
- Scheduled time must be in future
- Batch limited to 10 items
- File type validation for uploads
- Publish only allowed when status is "ready"

### ✅ Testing

- Unit tests for services (LLM, TTS, thumbnail)
- Integration tests for API endpoints
- Test fixtures and mocks
- pytest configuration
- Coverage reporting

### ✅ DevOps

- Docker Compose for local development
- Dockerfile for production builds
- GitHub Actions CI pipeline
- Alembic database migrations
- Health checks for all services
- Structured JSON logging
- Sentry integration (optional)

### ✅ Documentation

- Comprehensive README with quick start
- API documentation with examples
- Instagram setup guide
- Deployment guide (Docker, K8s, AWS)
- Mock server for frontend development
- OpenAPI specification auto-generated
- Inline code documentation

## Database Schema

### users
- id (PK)
- username (unique)
- email (unique)
- password_hash
- is_active
- created_at

### reels
- id (PK)
- user_id (FK → users)
- prompt
- topic
- duration_seconds
- voice
- music_mood
- status (indexed)
- caption
- hashtags (JSON)
- video_url
- thumbnail_url
- ig_post_id
- scheduled_time (indexed)
- meta (JSON)
- created_at (indexed)
- updated_at

### analytics
- id (PK)
- reel_id (FK → reels)
- event_type (indexed)
- payload (JSON)
- created_at (indexed)

### tasks
- id (PK)
- task_id (unique)
- reel_id (FK → reels)
- type
- status
- logs (text)
- created_at

## Technology Stack

### Core
- **Python**: 3.11+
- **FastAPI**: 0.109.0 - Modern async web framework
- **Uvicorn**: ASGI server
- **Pydantic**: 2.5.3 - Data validation
- **SQLAlchemy**: 2.0.25 - ORM
- **Alembic**: 1.13.1 - Migrations

### Task Queue
- **Celery**: 5.3.6 - Distributed task queue
- **Redis**: 5.0.1 - Broker and result backend

### Database
- **PostgreSQL**: 15 - Primary database
- **psycopg2-binary**: 2.9.9 - PostgreSQL adapter

### AI/ML
- **OpenAI**: 1.10.0 - GPT-4o for scripts
- **ElevenLabs**: 0.2.27 - Text-to-speech

### Video Processing
- **MoviePy**: 1.0.3 - Video editing
- **OpenCV**: 4.9.0.80 - Computer vision
- **FFmpeg**: System dependency

### Storage
- **boto3**: 1.34.34 - AWS S3 client

### Security
- **python-jose**: 3.3.0 - JWT tokens
- **passlib**: 1.7.4 - Password hashing

### Monitoring
- **Sentry**: 1.40.0 - Error tracking

### Testing
- **pytest**: 7.4.4
- **pytest-asyncio**: 0.23.3
- **pytest-cov**: 4.1.0

## File Structure

```
reel-genie-backend/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI
├── alembic/
│   ├── versions/
│   │   ├── 001_initial_migration.py  # Initial schema
│   │   └── __init__.py
│   ├── env.py                        # Alembic config
│   ├── script.py.mako                # Migration template
│   └── README
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── analytics.py      # Analytics endpoints
│   │       │   ├── auth.py           # Authentication
│   │       │   ├── health.py         # Health checks
│   │       │   ├── reels.py          # Reel CRUD
│   │       │   ├── stream.py         # SSE streaming
│   │       │   ├── uploads.py        # File uploads
│   │       │   └── __init__.py
│   │       ├── deps.py               # Dependencies (auth)
│   │       └── __init__.py
│   ├── core/
│   │   ├── config.py                 # Settings
│   │   ├── security.py               # JWT, password hashing
│   │   └── __init__.py
│   ├── db/
│   │   ├── base.py                   # Database setup
│   │   └── __init__.py
│   ├── models/
│   │   ├── analytics.py              # Analytics model
│   │   ├── reel.py                   # Reel model
│   │   ├── task.py                   # Task model
│   │   ├── user.py                   # User model
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── auth.py                   # Auth schemas
│   │   ├── error.py                  # Error schemas
│   │   ├── reel.py                   # Reel schemas
│   │   └── __init__.py
│   ├── services/
│   │   ├── instagram_service.py      # Instagram API
│   │   ├── llm_service.py            # OpenAI integration
│   │   ├── storage_service.py        # S3 operations
│   │   ├── thumbnail_service.py      # Thumbnail selection
│   │   ├── tts_service.py            # ElevenLabs TTS
│   │   ├── video_service.py          # Video assembly
│   │   └── __init__.py
│   ├── tasks/
│   │   ├── celery_app.py             # Celery config
│   │   ├── generation.py             # Generation pipeline
│   │   ├── publishing.py             # Instagram publishing
│   │   ├── scheduled.py              # Scheduled tasks
│   │   └── __init__.py
│   ├── main.py                       # FastAPI app
│   └── __init__.py
├── docs/
│   ├── API.md                        # API documentation
│   ├── DEPLOYMENT.md                 # Deployment guide
│   └── INSTAGRAM_SETUP.md            # Instagram setup
├── mock/
│   ├── db.json                       # Mock data
│   ├── routes.json                   # Mock routes
│   └── README.md                     # Mock server docs
├── scripts/
│   ├── export_openapi.py             # Export OpenAPI spec
│   ├── init_db.py                    # Initialize database
│   ├── start_dev.sh                  # Dev startup script
│   └── __init__.py
├── tests/
│   ├── conftest.py                   # Test fixtures
│   ├── test_auth.py                  # Auth tests
│   ├── test_reels.py                 # Reel tests
│   ├── test_services.py              # Service tests
│   └── __init__.py
├── .dockerignore                     # Docker ignore
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore
├── alembic.ini                       # Alembic config
├── CHANGELOG.md                      # Version history
├── docker-compose.yml                # Local development
├── Dockerfile                        # Container image
├── LICENSE                           # MIT License
├── Makefile                          # Build commands
├── PROJECT_SUMMARY.md                # This file
├── pytest.ini                        # Pytest config
├── README.md                         # Main documentation
└── requirements.txt                  # Python dependencies
```

## Getting Started

### 1. Prerequisites
```bash
# Install Python 3.11+
python --version

# Install Docker
docker --version
```

### 2. Setup
```bash
# Clone repository
git clone <repo-url>
cd reel-genie-backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Run
```bash
# Start all services
docker-compose up

# Or use Make
make dev

# Or use startup script
chmod +x scripts/start_dev.sh
./scripts/start_dev.sh
```

### 4. Initialize
```bash
# Run migrations
alembic upgrade head

# Create demo user
python scripts/init_db.py
```

### 5. Test
```bash
# Access API docs
open http://localhost:8000/docs

# Login
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo@example.com", "password": "demo123"}'

# Create reel
curl -X POST http://localhost:8000/v1/reels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "duration_seconds": 30}'
```

## Deployment

### Docker Production
```bash
docker build -t reel-genie-backend:latest .
docker run -p 8000:8000 --env-file .env.production reel-genie-backend:latest
```

### Kubernetes
See `docs/DEPLOYMENT.md` for complete K8s manifests.

### AWS ECS
See `docs/DEPLOYMENT.md` for ECS task definitions.

## Monitoring

- **API Docs**: http://localhost:8000/docs
- **Flower (Celery)**: http://localhost:5555
- **Health Check**: http://localhost:8000/v1/health
- **Logs**: Structured JSON to stdout
- **Sentry**: Error tracking (if configured)

## Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test
pytest tests/test_reels.py -v
```

## Next Steps

### For Frontend Integration
1. Use mock server: `json-server --watch mock/db.json --port 8000`
2. Review API docs: `docs/API.md`
3. Get OpenAPI spec: `python scripts/export_openapi.py`
4. Test endpoints with Postman/Insomnia

### For Production Deployment
1. Review `docs/DEPLOYMENT.md`
2. Set up Instagram app (see `docs/INSTAGRAM_SETUP.md`)
3. Configure production environment variables
4. Set up monitoring and alerts
5. Run database migrations
6. Deploy with Docker/K8s/ECS

### For Development
1. Review code structure
2. Add new endpoints in `app/api/v1/endpoints/`
3. Add new services in `app/services/`
4. Add new models in `app/models/`
5. Create migrations: `alembic revision --autogenerate -m "description"`
6. Write tests in `tests/`

## Support

- **Documentation**: `/docs` endpoint
- **API Reference**: `docs/API.md`
- **Issues**: GitHub Issues
- **Email**: support@example.com

## License

MIT License - see LICENSE file for details.
