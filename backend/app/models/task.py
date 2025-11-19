from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True, nullable=False)
    reel_id = Column(Integer, ForeignKey("reels.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    logs = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    reel = relationship("Reel", back_populates="tasks")
