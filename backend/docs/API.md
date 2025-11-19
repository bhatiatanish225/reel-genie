# API Documentation

Base URL: `https://api.example.com/v1`

All requests require `Authorization: Bearer <token>` header except auth endpoints.

## Error Format

All errors follow this format:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human readable message",
    "details": {
      "field": "Specific error detail"
    }
  }
}
```

## Authentication

### POST /v1/auth/login

Login and get access token.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "secret"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "username": "user@example.com"
  }
}
```

### POST /v1/auth/refresh

Refresh access token.

**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "username": "user@example.com"
  }
}
```

## Reels

### POST /v1/reels

Create and queue a new reel for generation.

**Request:**
```json
{
  "prompt": "financial literacy tips for students",
  "duration_seconds": 30,
  "voice": "female_alloy",
  "music_mood": "calm_upbeat",
  "post_now": false,
  "scheduled_time": "2025-11-20T12:00:00Z",
  "metadata": {
    "campaign": "nov2025"
  }
}
```

**Validation:**
- `prompt`: required, min 1 char
- `duration_seconds`: required, must be 15, 30, or 60
- `voice`: optional, default "female_alloy"
- `scheduled_time`: optional, must be future date if provided

**Response 201:**
```json
{
  "id": 123,
  "status": "queued",
  "created_at": "2025-11-19T09:00:00Z",
  "scheduled_time": "2025-11-20T12:00:00Z",
  "estimated_time_seconds": 120,
  "links": {
    "detail": "/v1/reels/123"
  }
}
```

### POST /v1/reels/batch

Create multiple reels in batch (max 10).

**Request:**
```json
{
  "items": [
    {
      "prompt": "Tip 1",
      "duration_seconds": 15
    },
    {
      "prompt": "Tip 2",
      "duration_seconds": 30
    }
  ],
  "global_options": {
    "music_mood": "energetic",
    "post_now": false
  }
}
```

**Response 202:**
```json
{
  "batch_id": "bch_20251119_1",
  "created_count": 2,
  "items": [
    {"id": 201, "status": "queued"},
    {"id": 202, "status": "queued"}
  ]
}
```

### GET /v1/reels/{id}

Get detailed reel information.

**Response 200:**
```json
{
  "id": 123,
  "user_id": 1,
  "prompt": "financial literacy tips",
  "duration_seconds": 30,
  "status": "ready",
  "caption": "Stop wasting money in 2025!",
  "hashtags": ["#moneytips", "#students"],
  "video_url": "https://cdn.example.com/reels/123.mp4",
  "thumbnail_url": "https://cdn.example.com/thumbs/123.jpg",
  "scheduled_time": "2025-11-20T12:00:00Z",
  "ig_post_id": null,
  "created_at": "2025-11-19T09:00:00Z",
  "logs": [
    {
      "ts": "2025-11-19T09:02:15Z",
      "level": "info",
      "message": "Script generated"
    }
  ]
}
```

**Status Values:**
- `created` - Initial state
- `queued` - Queued for processing
- `generating` - Currently generating
- `ready` - Ready to publish
- `scheduled` - Scheduled for future
- `posting` - Publishing to Instagram
- `posted` - Successfully posted
- `failed` - Generation/posting failed
- `cancelled` - Cancelled by user

### GET /v1/reels

List reels with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `status`: Filter by status (optional)

**Response 200:**
```json
{
  "items": [
    {
      "id": 123,
      "prompt": "financial tips",
      "thumbnail_url": "https://cdn.example.com/thumbs/123.jpg",
      "status": "ready",
      "scheduled_time": null,
      "created_at": "2025-11-19T09:00:00Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 124
}
```

### POST /v1/reels/{id}/retry

Retry failed reel generation.

**Response 202:**
```json
{
  "message": "Reel queued for retry",
  "status": "queued"
}
```

### POST /v1/reels/{id}/cancel

Cancel reel (only if not posted).

**Response 200:**
```json
{
  "message": "Reel cancelled",
  "status": "cancelled"
}
```

**Error 409:** Already posted

### POST /v1/reels/{id}/regenerate-thumbnail

Regenerate thumbnail for existing video.

**Response 200:**
```json
{
  "message": "Thumbnail regeneration queued",
  "thumbnail_url": "https://cdn.example.com/thumbs/123.jpg"
}
```

### POST /v1/reels/{id}/publish

Publish reel to Instagram.

**Request:**
```json
{
  "publish_now": true,
  "caption_override": "New caption",
  "hashtags_override": ["#new", "#tags"]
}
```

**Validation:**
- Only allowed if status is `ready`

**Response 200:**
```json
{
  "id": 123,
  "status": "posting",
  "ig_task_id": "igtask_456"
}
```

## Uploads

### POST /v1/uploads

Upload media file (video/image).

**Request:** `multipart/form-data`
- `file`: File to upload

**Allowed Types:**
- `video/mp4`
- `video/quicktime`
- `image/jpeg`
- `image/png`

**Response 201:**
```json
{
  "upload_id": "u_abc123",
  "file_url": "https://cdn.example.com/uploads/u_abc123.mp4"
}
```

## Analytics

### GET /v1/analytics

Get aggregated analytics data.

**Query Parameters:**
- `start`: Start date (ISO 8601, required)
- `end`: End date (ISO 8601, required)
- `metrics`: Comma-separated metrics (default: "posts,engagement")

**Response 200:**
```json
{
  "metrics": {
    "posts": 12,
    "total_impressions": 12345,
    "total_likes": 678
  },
  "timeseries": [
    {
      "date": "2025-11-01T00:00:00Z",
      "posts": 2,
      "generated": 3
    }
  ],
  "top_hashtags": [
    {"tag": "#moneytips", "count": 5}
  ]
}
```

## Real-time Updates

### GET /v1/reels/stream

Server-Sent Events stream for real-time updates.

**Query Parameters:**
- `token`: Access token (required)

**Event Types:**

**reel.status_update:**
```json
{
  "type": "reel.status_update",
  "payload": {
    "id": 123,
    "status": "ready",
    "ts": "2025-11-19T09:05:00Z"
  }
}
```

**reel.log:**
```json
{
  "type": "reel.log",
  "payload": {
    "reel_id": 123,
    "ts": "2025-11-19T09:05:00Z",
    "level": "info",
    "message": "Video assembly complete"
  }
}
```

## Health

### GET /v1/health

Health check endpoint.

**Response 200:**
```json
{
  "status": "ok",
  "services": {
    "redis": "ok",
    "postgres": "ok",
    "s3": "ok"
  }
}
```

**Status Values:**
- `ok` - All services healthy
- `degraded` - Some services unhealthy

## Rate Limits

- **Authentication**: 10 requests/minute
- **Reel Creation**: 100 requests/hour per user
- **Batch Creation**: 10 requests/hour per user
- **Publishing**: 25 posts/day per user (Instagram limit)

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637337600
```

## Pagination

All list endpoints support pagination:

```
GET /v1/reels?page=2&page_size=50
```

Response includes:
```json
{
  "items": [...],
  "page": 2,
  "page_size": 50,
  "total": 234
}
```

## Filtering

Supported filters:
- `status`: Filter by reel status
- `start_date`: Filter by creation date (ISO 8601)
- `end_date`: Filter by creation date (ISO 8601)

Example:
```
GET /v1/reels?status=ready&start_date=2025-11-01
```
