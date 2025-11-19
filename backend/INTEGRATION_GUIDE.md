# Frontend Integration Guide

This guide helps frontend developers integrate with the Reel Genie backend API.

## Quick Start

### Option 1: Mock Server (No Backend Required)

Perfect for initial development without running the full backend.

```bash
# Install json-server
npm install -g json-server

# Start mock server
cd reel-genie-backend/mock
json-server --watch db.json --routes routes.json --port 8000

# Mock API now available at http://localhost:8000
```

### Option 2: Local Backend

Run the full backend locally.

```bash
cd reel-genie-backend
docker-compose up
```

API available at http://localhost:8000

## API Base URL

```typescript
// config.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.yourdomain.com/v1'
  : 'http://localhost:8000/v1';
```

## Authentication

### Login Flow

```typescript
// auth.service.ts
interface LoginRequest {
  username: string;  // email
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
  };
}

async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}
```

### Token Storage

```typescript
// Store token
localStorage.setItem('access_token', response.access_token);

// Get token
const token = localStorage.getItem('access_token');

// Add to requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Token Refresh

```typescript
async function refreshToken(refreshToken: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  return response.json();
}
```

## Creating Reels

### Single Reel

```typescript
interface CreateReelRequest {
  prompt: string;
  duration_seconds: 15 | 30 | 60;
  voice?: string;
  music_mood?: string;
  post_now?: boolean;
  scheduled_time?: string;  // ISO 8601
  metadata?: Record<string, any>;
}

interface CreateReelResponse {
  id: number;
  status: string;
  created_at: string;
  scheduled_time?: string;
  estimated_time_seconds: number;
  links: {
    detail: string;
  };
}

async function createReel(data: CreateReelRequest): Promise<CreateReelResponse> {
  const response = await fetch(`${API_BASE_URL}/reels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}

// Usage
const reel = await createReel({
  prompt: "5 money-saving tips for students",
  duration_seconds: 30,
  voice: "female_alloy",
  music_mood: "calm_upbeat"
});

console.log(`Reel ${reel.id} created with status: ${reel.status}`);
```

### Batch Creation

```typescript
interface BatchReelRequest {
  items: Array<{
    prompt: string;
    duration_seconds: 15 | 30 | 60;
    voice?: string;
    music_mood?: string;
  }>;
  global_options?: {
    music_mood?: string;
    post_now?: boolean;
  };
}

async function createBatchReels(data: BatchReelRequest) {
  const response = await fetch(`${API_BASE_URL}/reels/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  return response.json();
}

// Usage
const batch = await createBatchReels({
  items: [
    { prompt: "Tip 1", duration_seconds: 15 },
    { prompt: "Tip 2", duration_seconds: 30 }
  ],
  global_options: { music_mood: "energetic" }
});
```

## Fetching Reels

### List Reels

```typescript
interface ReelSummary {
  id: number;
  prompt: string;
  thumbnail_url?: string;
  status: string;
  scheduled_time?: string;
  created_at: string;
}

interface ReelListResponse {
  items: ReelSummary[];
  page: number;
  page_size: number;
  total: number;
}

async function listReels(
  page = 1, 
  pageSize = 20, 
  status?: string
): Promise<ReelListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    ...(status && { status })
  });
  
  const response = await fetch(`${API_BASE_URL}/reels?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}

// Usage
const reels = await listReels(1, 20, 'ready');
```

### Get Reel Detail

```typescript
interface ReelDetail {
  id: number;
  user_id: number;
  prompt: string;
  duration_seconds: number;
  status: string;
  caption?: string;
  hashtags: string[];
  video_url?: string;
  thumbnail_url?: string;
  scheduled_time?: string;
  ig_post_id?: string;
  created_at: string;
  logs: Array<{
    ts: string;
    level: string;
    message: string;
  }>;
}

async function getReel(id: number): Promise<ReelDetail> {
  const response = await fetch(`${API_BASE_URL}/reels/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}
```

## Real-time Updates

### Server-Sent Events (SSE)

```typescript
function subscribeToReelUpdates(token: string, onUpdate: (event: any) => void) {
  const eventSource = new EventSource(
    `${API_BASE_URL}/reels/stream?token=${token}`
  );
  
  eventSource.addEventListener('reel.status_update', (event) => {
    const data = JSON.parse(event.data);
    onUpdate(data);
  });
  
  eventSource.addEventListener('reel.log', (event) => {
    const data = JSON.parse(event.data);
    console.log(`[${data.payload.level}] ${data.payload.message}`);
  });
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
  };
  
  return () => eventSource.close();
}

// Usage
const unsubscribe = subscribeToReelUpdates(token, (event) => {
  if (event.type === 'reel.status_update') {
    console.log(`Reel ${event.payload.id} status: ${event.payload.status}`);
    // Update UI
  }
});

// Cleanup
unsubscribe();
```

### Polling Fallback

If SSE is not available, poll for updates:

```typescript
function pollReelStatus(reelId: number, interval = 5000) {
  const intervalId = setInterval(async () => {
    const reel = await getReel(reelId);
    
    // Update UI with reel status
    if (reel.status === 'ready' || reel.status === 'failed') {
      clearInterval(intervalId);
    }
  }, interval);
  
  return () => clearInterval(intervalId);
}
```

## Publishing

```typescript
interface PublishRequest {
  publish_now: boolean;
  caption_override?: string;
  hashtags_override?: string[];
}

async function publishReel(id: number, data: PublishRequest) {
  const response = await fetch(`${API_BASE_URL}/reels/${id}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  return response.json();
}

// Usage
await publishReel(123, {
  publish_now: true,
  caption_override: "Custom caption",
  hashtags_override: ["#custom", "#tags"]
});
```

## Analytics

```typescript
interface AnalyticsResponse {
  metrics: {
    posts: number;
    total_impressions: number;
    total_likes: number;
  };
  timeseries: Array<{
    date: string;
    posts: number;
    generated: number;
  }>;
  top_hashtags: Array<{
    tag: string;
    count: number;
  }>;
}

async function getAnalytics(
  startDate: string,
  endDate: string
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams({
    start: startDate,
    end: endDate,
    metrics: 'posts,engagement'
  });
  
  const response = await fetch(`${API_BASE_URL}/analytics?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}

// Usage
const analytics = await getAnalytics(
  '2025-11-01T00:00:00Z',
  '2025-11-19T23:59:59Z'
);
```

## File Uploads

```typescript
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type, browser will set it with boundary
    },
    body: formData
  });
  
  return response.json();
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const result = await uploadFile(file);
console.log(`Uploaded: ${result.file_url}`);
```

## Error Handling

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

async function handleAPICall<T>(
  apiCall: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const error: APIError = await response.json();
      
      // Handle specific error codes
      switch (error.error.code) {
        case 'invalid_credentials':
          // Redirect to login
          break;
        case 'invalid_request':
          // Show validation errors
          console.error(error.error.details);
          break;
        default:
          // Show generic error
          console.error(error.error.message);
      }
      
      throw new Error(error.error.message);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
```

## React Hooks Example

```typescript
// useReels.ts
import { useState, useEffect } from 'react';

export function useReels(status?: string) {
  const [reels, setReels] = useState<ReelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchReels() {
      try {
        setLoading(true);
        const data = await listReels(1, 20, status);
        setReels(data.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReels();
  }, [status]);
  
  return { reels, loading, error };
}

// useReelDetail.ts
export function useReelDetail(id: number) {
  const [reel, setReel] = useState<ReelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchReel() {
      const data = await getReel(id);
      setReel(data);
      setLoading(false);
    }
    
    fetchReel();
    
    // Subscribe to updates
    const unsubscribe = subscribeToReelUpdates(token, (event) => {
      if (event.payload.id === id) {
        fetchReel(); // Refresh data
      }
    });
    
    return unsubscribe;
  }, [id]);
  
  return { reel, loading };
}

// Usage in component
function ReelList() {
  const { reels, loading, error } = useReels('ready');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {reels.map(reel => (
        <ReelCard key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
```

## TypeScript Types

```typescript
// types/api.ts
export type ReelStatus = 
  | 'created'
  | 'queued'
  | 'generating'
  | 'ready'
  | 'scheduled'
  | 'posting'
  | 'posted'
  | 'failed'
  | 'cancelled';

export type DurationSeconds = 15 | 30 | 60;

export type Voice = 'female_alloy' | 'male_echo' | 'female_nova';

export type MusicMood = 'calm_upbeat' | 'energetic' | 'chill';

export interface Reel {
  id: number;
  user_id: number;
  prompt: string;
  duration_seconds: DurationSeconds;
  status: ReelStatus;
  voice: Voice;
  music_mood?: MusicMood;
  caption?: string;
  hashtags: string[];
  video_url?: string;
  thumbnail_url?: string;
  scheduled_time?: string;
  ig_post_id?: string;
  created_at: string;
}
```

## Testing

```typescript
// Mock API for testing
export const mockAPI = {
  login: jest.fn().mockResolvedValue({
    access_token: 'mock-token',
    token_type: 'bearer',
    expires_in: 3600,
    user: { id: 1, username: 'test@example.com' }
  }),
  
  createReel: jest.fn().mockResolvedValue({
    id: 1,
    status: 'queued',
    created_at: new Date().toISOString(),
    estimated_time_seconds: 120,
    links: { detail: '/v1/reels/1' }
  }),
  
  listReels: jest.fn().mockResolvedValue({
    items: [],
    page: 1,
    page_size: 20,
    total: 0
  })
};
```

## Best Practices

1. **Token Management**
   - Store tokens securely
   - Implement automatic refresh
   - Clear tokens on logout

2. **Error Handling**
   - Handle network errors
   - Show user-friendly messages
   - Log errors for debugging

3. **Loading States**
   - Show loading indicators
   - Disable buttons during requests
   - Handle race conditions

4. **Real-time Updates**
   - Use SSE for live updates
   - Fall back to polling if needed
   - Clean up subscriptions

5. **Caching**
   - Cache reel lists
   - Invalidate on updates
   - Use React Query or SWR

6. **Validation**
   - Validate on client side
   - Handle server validation errors
   - Show field-specific errors

## Resources

- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json
- **Mock Server**: `reel-genie-backend/mock/`
- **Example Requests**: `docs/API.md`

## Support

- GitHub Issues for bugs
- Email: support@example.com
- Documentation: `reel-genie-backend/docs/`
