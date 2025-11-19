from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Reel(Base):
    __tablename__ = "reels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    topic = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=False)
    voice = Column(String, nullable=False)
    music_mood = Column(String, nullable=True)
    status = Column(String, nullable=False, default="created", index=True)
    caption = Column(Text, nullable=True)
    hashtags = Column(JSON, default=list)
    video_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    ig_post_id = Column(String, nullable=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=True, index=True)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reels")
    analytics = relationship("Analytics", back_populates="reel", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="reel", cascade="all, delete-orphan")
