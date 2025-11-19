from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class ReelCreateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    duration_seconds: int = Field(..., ge=15, le=60)
    voice: str = "female_alloy"
    music_mood: Optional[str] = "calm_upbeat"
    post_now: bool = False
    scheduled_time: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

    @field_validator('duration_seconds')
    @classmethod
    def validate_duration(cls, v):
        if v not in [15, 30, 60]:
            raise ValueError('duration_seconds must be 15, 30, or 60')
        return v

    @field_validator('scheduled_time')
    @classmethod
    def validate_scheduled_time(cls, v, info):
        if v and v < datetime.utcnow():
            raise ValueError('scheduled_time must be in the future')
        return v


class BatchReelItem(BaseModel):
    prompt: str = Field(..., min_length=1)
    duration_seconds: int = Field(..., ge=15, le=60)
    voice: Optional[str] = None
    music_mood: Optional[str] = None


class BatchReelRequest(BaseModel):
    items: List[BatchReelItem] = Field(..., max_length=10)
    global_options: Optional[Dict[str, Any]] = None

    @field_validator('items')
    @classmethod
    def validate_items_count(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 items allowed in batch')
        return v


class ReelCreateResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    scheduled_time: Optional[datetime] = None
    estimated_time_seconds: int
    links: Dict[str, str]


class BatchReelResponse(BaseModel):
    batch_id: str
    created_count: int
    items: List[Dict[str, Any]]


class LogEntry(BaseModel):
    ts: datetime
    level: str
    message: str


class ReelDetailResponse(BaseModel):
    id: int
    user_id: int
    prompt: str
    duration_seconds: int
    status: str
    caption: Optional[str] = None
    hashtags: List[str] = []
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    ig_post_id: Optional[str] = None
    created_at: datetime
    logs: List[LogEntry] = []

    class Config:
        from_attributes = True


class ReelSummary(BaseModel):
    id: int
    prompt: str
    thumbnail_url: Optional[str] = None
    status: str
    scheduled_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReelListResponse(BaseModel):
    items: List[ReelSummary]
    page: int
    page_size: int
    total: int


class PublishRequest(BaseModel):
    publish_now: bool = True
    caption_override: Optional[str] = None
    hashtags_override: Optional[List[str]] = None


class PublishResponse(BaseModel):
    id: int
    status: str
    ig_task_id: str
