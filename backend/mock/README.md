# Mock Server for Frontend Development

This mock server allows frontend developers to work independently before the real backend is ready.

## Setup

### Option 1: JSON Server (Recommended)

```bash
# Install json-server globally
npm install -g json-server

# Start mock server
json-server --watch mock/db.json --routes mock/routes.json --port 8000
```

### Option 2: Python HTTP Server

```bash
# Simple static file server
python -m http.server 8000 --directory mock/
```

## Available Endpoints

### Authentication

```bash
# Login (returns mock token)
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo@example.com", "password": "demo123"}'
```

### Reels

```bash
# List reels
curl http://localhost:8000/reels

# Get reel detail
curl http://localhost:8000/reels/1

# Create reel (POST)
curl -X POST http://localhost:8000/reels \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "duration_seconds": 30}'
```

### Analytics

```bash
# Get analytics
curl http://localhost:8000/analytics
```

## Mock Data

Edit `mock/db.json` to customize mock data:

```json
{
  "reels": [...],
  "users": [...],
  "analytics": [...]
}
```

## Features

- ✅ Full CRUD operations
- ✅ Pagination support
- ✅ Filtering and sorting
- ✅ Relationships
- ✅ Custom routes
- ✅ CORS enabled

## Limitations

- No authentication validation
- No business logic
- No real-time updates
- No file uploads
- Data resets on restart

## Switching to Real API

Update your frontend API base URL:

```javascript
// Development (mock)
const API_BASE_URL = 'http://localhost:8000';

// Production (real)
const API_BASE_URL = 'https://api.example.com/v1';
```
