# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-19

### Added
- Initial release
- FastAPI-based REST API with OpenAPI documentation
- JWT authentication with access and refresh tokens
- PostgreSQL database with SQLAlchemy ORM
- Alembic database migrations
- Celery task queue with Redis broker
- OpenAI GPT-4o integration for script generation
- ElevenLabs TTS integration for voiceover
- Pexels API integration for stock footage
- MoviePy-based video assembly pipeline
- OpenCV-based smart thumbnail selection
- Instagram Graph API integration for publishing
- S3-compatible storage for media files
- Real-time updates via Server-Sent Events
- Analytics and insights tracking
- Batch reel generation (up to 10 items)
- Scheduled publishing with Celery Beat
- Comprehensive error handling and logging
- Docker and Docker Compose setup
- Unit and integration tests
- CI/CD pipeline with GitHub Actions
- Mock server for frontend development
- Comprehensive documentation

### API Endpoints
- `POST /v1/auth/login` - User authentication
- `POST /v1/auth/refresh` - Token refresh
- `POST /v1/reels` - Create single reel
- `POST /v1/reels/batch` - Batch create reels
- `GET /v1/reels` - List reels with pagination
- `GET /v1/reels/{id}` - Get reel details
- `POST /v1/reels/{id}/retry` - Retry failed reel
- `POST /v1/reels/{id}/cancel` - Cancel reel
- `POST /v1/reels/{id}/publish` - Publish to Instagram
- `POST /v1/reels/{id}/regenerate-thumbnail` - Regenerate thumbnail
- `POST /v1/uploads` - Upload media files
- `GET /v1/analytics` - Get analytics data
- `GET /v1/reels/stream` - Real-time updates stream
- `GET /v1/health` - Health check

### Infrastructure
- PostgreSQL 15 for data persistence
- Redis 7 for caching and task queue
- AWS S3 for media storage
- Celery workers for async processing
- Celery Beat for scheduled tasks
- Flower for Celery monitoring

### Documentation
- README with quick start guide
- API documentation
- Instagram setup guide
- Deployment guide
- OpenAPI specification
- Mock server documentation

## [Unreleased]

### Planned
- WebSocket support for real-time updates
- Multi-user support with teams
- Advanced analytics dashboard
- A/B testing for captions/hashtags
- Video templates and presets
- Custom music upload
- Multi-platform support (TikTok, YouTube Shorts)
- Content calendar and scheduling UI
- AI-powered hashtag suggestions
- Automated performance optimization
- Content moderation and compliance checks
