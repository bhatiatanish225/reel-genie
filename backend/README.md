# Reel Genie Backend

Production-ready backend for AI-powered reel generation and auto-posting to Instagram.

## Features

- 🤖 **AI Script Generation** - GPT-4o powered script writing
- 🎙️ **Text-to-Speech** - ElevenLabs voice synthesis
- 🎬 **Video Assembly** - Automated video creation with stock footage
- 📸 **Smart Thumbnails** - AI-powered thumbnail selection
- 📱 **Instagram Integration** - Direct posting via Graph API
- 📊 **Analytics** - Track performance and engagement
- ⚡ **Real-time Updates** - SSE streaming for live progress
- 🔄 **Task Queue** - Celery-based async processing
- 📦 **S3 Storage** - Scalable media storage

## Tech Stack

- **Framework**: FastAPI 0.109+
- **Database**: PostgreSQL 15 with SQLAlchemy
- **Task Queue**: Celery with Redis
- **Storage**: AWS S3 / MinIO
- **AI/ML**: OpenAI GPT-4o, ElevenLabs TTS
- **Video**: FFmpeg, MoviePy, OpenCV
- **Social**: Instagram Graph API

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### 1. Clone and Setup

```bash
git clone <repo-url>
cd reel-genie-backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Start Development Environment

```bash
# Using Docker Compose (recommended)
docker-compose up

# Or using Make
make dev

# Or using the startup script
chmod +x scripts/start_dev.sh
./scripts/start_dev.sh
```

### 3. Initialize Database

```bash
# Run migrations
alembic upgrade head

# Create demo user
python scripts/init_db.py
```

### 4. Access Services

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Flower (Celery Monitor)**: http://localhost:5555

## API Documentation

### Authentication

```bash
# Login
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo@example.com", "password": "demo123"}'
```

### Create Reel

```bash
curl -X POST http://localhost:8000/v1/reels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "financial literacy tips for students",
    "duration_seconds": 30,
    "voice": "female_alloy",
    "music_mood": "calm_upbeat"
  }'
```

### Batch Generation

```bash
curl -X POST http://localhost:8000/v1/reels/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"prompt": "Tip 1", "duration_seconds": 15},
      {"prompt": "Tip 2", "duration_seconds": 30}
    ],
    "global_options": {"music_mood": "energetic"}
  }'
```

### Get Reel Status

```bash
curl http://localhost:8000/v1/reels/123 \
  -H "Authorization: Bearer <token>"
```

### Publish to Instagram

```bash
curl -X POST http://localhost:8000/v1/reels/123/publish \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"publish_now": true}'
```

### Stream Real-time Updates

```bash
curl -N http://localhost:8000/v1/reels/stream?token=<token>
```

## Project Structure

```
reel-genie-backend/
├── app/
│   ├── api/v1/endpoints/    # API route handlers
│   ├── core/                # Config, security
│   ├── db/                  # Database setup
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── tasks/               # Celery tasks
│   └── main.py              # FastAPI app
├── alembic/                 # Database migrations
├── tests/                   # Unit & integration tests
├── mock/                    # Mock server for frontend
├── scripts/                 # Utility scripts
├── docker-compose.yml       # Local development
├── Dockerfile               # Container image
└── requirements.txt         # Python dependencies
```

## Development

### Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/test_reels.py -v
```

### Linting

```bash
# Format code
black app/ tests/

# Check formatting
black app/ tests/ --check

# Lint
flake8 app/ tests/

# Type checking
mypy app/
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - JWT signing key
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - S3 credentials
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `INSTAGRAM_ACCESS_TOKEN` - Instagram Graph API token

### Instagram Setup

1. Create a Facebook App at https://developers.facebook.com
2. Add Instagram Graph API product
3. Generate long-lived access token
4. Configure webhook for insights (optional)
5. Submit app for review to enable publishing

See `docs/INSTAGRAM_SETUP.md` for detailed instructions.

## Deployment

### Docker Production Build

```bash
docker build -t reel-genie-backend:latest .
docker push your-registry/reel-genie-backend:latest
```

### Environment-specific Configs

- **Development**: `.env`
- **Staging**: `.env.staging`
- **Production**: Use environment variables or secrets manager

### Scaling

- **API**: Horizontal scaling with load balancer
- **Workers**: Scale Celery workers based on queue depth
- **Database**: Use read replicas for analytics queries
- **Storage**: Use CDN for media delivery

## Monitoring

### Logs

Structured JSON logs to stdout:

```json
{"time": "2025-11-19T10:00:00Z", "level": "INFO", "message": "Reel 123 generated"}
```

### Sentry Integration

Set `SENTRY_DSN` in environment to enable error tracking.

### Celery Monitoring

Access Flower dashboard at http://localhost:5555

### Health Checks

```bash
curl http://localhost:8000/v1/health
```

## Troubleshooting

### Common Issues

**Database connection errors:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres
```

**Celery tasks not processing:**
```bash
# Check worker status
docker-compose logs celery_worker

# Restart workers
docker-compose restart celery_worker
```

**S3 upload failures:**
- Verify AWS credentials
- Check bucket permissions
- Ensure bucket exists

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: `/docs` endpoint
- Issues: GitHub Issues
- Email: support@example.com
