# Quick Start Guide

Get the Reel Genie backend running in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- Python 3.11+ (for local development)

## Step 1: Clone & Configure

```bash
# Clone the repository
git clone <repo-url>
cd reel-genie-backend

# Copy environment file
cp .env.example .env
```

## Step 2: Configure Credentials

Edit `.env` and add your API keys:

```bash
# Minimum required for testing
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reel_genie
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# AWS S3 (use MinIO for local testing)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=reel-genie
S3_ENDPOINT_URL=http://localhost:9000

# AI Services (get free trial keys)
OPENAI_API_KEY=sk-your-key
ELEVENLABS_API_KEY=your-key
PEXELS_API_KEY=your-key

# Instagram (optional for initial testing)
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-secret
INSTAGRAM_ACCESS_TOKEN=your-token
INSTAGRAM_USER_ID=your-user-id
```

## Step 3: Start Services

```bash
# Start everything with Docker Compose
docker-compose up
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- FastAPI API (port 8000)
- Celery Worker
- Celery Beat
- Flower (port 5555)

## Step 4: Initialize Database

In a new terminal:

```bash
# Run migrations
docker-compose exec api alembic upgrade head

# Create demo user
docker-compose exec api python scripts/init_db.py
```

Demo credentials:
- Email: `demo@example.com`
- Password: `demo123`

## Step 5: Test the API

### Access API Documentation

Open http://localhost:8000/docs in your browser.

### Login

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo@example.com",
    "password": "demo123"
  }'
```

Save the `access_token` from the response.

### Create a Reel

```bash
curl -X POST http://localhost:8000/v1/reels \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "5 quick money-saving tips for college students",
    "duration_seconds": 30,
    "voice": "female_alloy",
    "music_mood": "calm_upbeat"
  }'
```

### Check Reel Status

```bash
curl http://localhost:8000/v1/reels/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Monitor Celery Tasks

Open http://localhost:5555 to see Celery Flower dashboard.

## Common Commands

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f celery_worker

# Restart services
docker-compose restart api
docker-compose restart celery_worker

# Stop everything
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Run tests
docker-compose exec api pytest

# Access database
docker-compose exec postgres psql -U postgres -d reel_genie
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process or change port in docker-compose.yml
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Celery Tasks Not Processing

```bash
# Check worker logs
docker-compose logs celery_worker

# Restart worker
docker-compose restart celery_worker

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### API Keys Not Working

- Verify keys are correct in `.env`
- Check for extra spaces or quotes
- Restart services after changing `.env`

## Next Steps

### For Development

1. **Add New Endpoint**
   - Create file in `app/api/v1/endpoints/`
   - Add router to `app/main.py`
   - Add tests in `tests/`

2. **Add New Service**
   - Create file in `app/services/`
   - Import in task or endpoint
   - Add unit tests

3. **Database Changes**
   ```bash
   # Create migration
   docker-compose exec api alembic revision --autogenerate -m "description"
   
   # Apply migration
   docker-compose exec api alembic upgrade head
   ```

### For Frontend Integration

1. **Use Mock Server** (no backend needed)
   ```bash
   npm install -g json-server
   json-server --watch mock/db.json --port 8000
   ```

2. **Get OpenAPI Spec**
   ```bash
   curl http://localhost:8000/openapi.json > openapi.json
   ```

3. **Review API Docs**
   - Read `docs/API.md`
   - Test endpoints in Swagger UI: http://localhost:8000/docs

### For Production

1. Review `docs/DEPLOYMENT.md`
2. Set up Instagram app (see `docs/INSTAGRAM_SETUP.md`)
3. Configure production environment
4. Set up monitoring and alerts
5. Deploy with Docker/Kubernetes/AWS

## Resources

- **API Documentation**: http://localhost:8000/docs
- **Celery Monitor**: http://localhost:5555
- **Health Check**: http://localhost:8000/v1/health
- **Full Documentation**: See `README.md`
- **API Reference**: See `docs/API.md`

## Support

- GitHub Issues: Report bugs and request features
- Documentation: Check `docs/` folder
- Email: support@example.com

---

**You're all set!** 🚀

The backend is now running and ready to generate reels. Check the logs to see the generation pipeline in action.
