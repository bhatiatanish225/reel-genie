from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
from app.db.base import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.reel import Reel
from app.models.task import Task
from app.schemas.reel import (
    ReelCreateRequest, ReelCreateResponse, BatchReelRequest, BatchReelResponse,
    ReelDetailResponse, ReelListResponse, PublishRequest, PublishResponse, LogEntry
)
from app.schemas.error import ErrorResponse
from app.tasks.generation import generate_reel
from app.tasks.publishing import publish_reel
import json

router = APIRouter()


@router.post("", response_model=ReelCreateResponse, status_code=status.HTTP_201_CREATED)
def create_reel(
    request: ReelCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create reel record
    reel = Reel(
        user_id=current_user.id,
        prompt=request.prompt,
        duration_seconds=request.duration_seconds,
        voice=request.voice,
        music_mood=request.music_mood,
        status="queued",
        scheduled_time=request.scheduled_time,
        meta=request.metadata or {}
    )
    db.add(reel)
    db.commit()
    db.refresh(reel)
    
    # Enqueue generation task
    task = generate_reel.delay(reel.id, request.post_now)
    
    # Track task
    task_record = Task(
        task_id=task.id,
        reel_id=reel.id,
        type="generate",
        status="pending"
    )
    db.add(task_record)
    db.commit()
    
    return ReelCreateResponse(
        id=reel.id,
        status=reel.status,
        created_at=reel.created_at,
        scheduled_time=reel.scheduled_time,
        estimated_time_seconds=120,
        links={"detail": f"/v1/reels/{reel.id}"}
    )


@router.post("/batch", response_model=BatchReelResponse, status_code=status.HTTP_202_ACCEPTED)
def create_batch_reels(
    request: BatchReelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch_id = f"bch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    created_items = []
    
    for item in request.items:
        # Apply global options
        voice = item.voice or (request.global_options or {}).get("voice", "female_alloy")
        music_mood = item.music_mood or (request.global_options or {}).get("music_mood", "calm_upbeat")
        post_now = (request.global_options or {}).get("post_now", False)
        
        reel = Reel(
            user_id=current_user.id,
            prompt=item.prompt,
            duration_seconds=item.duration_seconds,
            voice=voice,
            music_mood=music_mood,
            status="queued",
            meta={"batch_id": batch_id}
        )
        db.add(reel)
        db.flush()
        
        # Enqueue task
        task = generate_reel.delay(reel.id, post_now)
        task_record = Task(task_id=task.id, reel_id=reel.id, type="generate", status="pending")
        db.add(task_record)
        
        created_items.append({"id": reel.id, "status": reel.status})
    
    db.commit()
    
    return BatchReelResponse(
        batch_id=batch_id,
        created_count=len(created_items),
        items=created_items
    )


@router.get("/{reel_id}", response_model=ReelDetailResponse)
def get_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    
    if not reel:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Reel not found"}})
    
    # Get logs from tasks
    logs = []
    for task in reel.tasks:
        if task.logs:
            try:
                task_logs = json.loads(task.logs)
                logs.extend([LogEntry(**log) for log in task_logs])
            except:
                pass
    
    return ReelDetailResponse(
        id=reel.id,
        user_id=reel.user_id,
        prompt=reel.prompt,
        duration_seconds=reel.duration_seconds,
        status=reel.status,
        caption=reel.caption,
        hashtags=reel.hashtags or [],
        video_url=reel.video_url,
        thumbnail_url=reel.thumbnail_url,
        scheduled_time=reel.scheduled_time,
        ig_post_id=reel.ig_post_id,
        created_at=reel.created_at,
        logs=sorted(logs, key=lambda x: x.ts)
    )


@router.get("", response_model=ReelListResponse)
def list_reels(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Reel).filter(Reel.user_id == current_user.id)
    
    if status:
        query = query.filter(Reel.status == status)
    
    total = query.count()
    items = query.order_by(Reel.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return ReelListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )


@router.post("/{reel_id}/retry", status_code=status.HTTP_202_ACCEPTED)
def retry_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    
    if not reel:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Reel not found"}})
    
    reel.status = "queued"
    db.commit()
    
    task = generate_reel.delay(reel.id, False)
    task_record = Task(task_id=task.id, reel_id=reel.id, type="generate_retry", status="pending")
    db.add(task_record)
    db.commit()
    
    return {"message": "Reel queued for retry", "status": "queued"}


@router.post("/{reel_id}/cancel")
def cancel_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    
    if not reel:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Reel not found"}})
    
    if reel.status == "posted":
        raise HTTPException(status_code=409, detail={"error": {"code": "already_posted", "message": "Cannot cancel posted reel"}})
    
    reel.status = "cancelled"
    db.commit()
    
    return {"message": "Reel cancelled", "status": "cancelled"}


@router.post("/{reel_id}/regenerate-thumbnail")
def regenerate_thumbnail(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    
    if not reel:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Reel not found"}})
    
    if not reel.video_url:
        raise HTTPException(status_code=400, detail={"error": {"code": "no_video", "message": "No video available"}})
    
    # TODO: Implement thumbnail regeneration
    return {"message": "Thumbnail regeneration queued", "thumbnail_url": reel.thumbnail_url}


@router.post("/{reel_id}/publish", response_model=PublishResponse)
def publish_reel_endpoint(
    reel_id: int,
    request: PublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    
    if not reel:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Reel not found"}})
    
    if reel.status != "ready":
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "invalid_status", "message": f"Cannot publish reel with status {reel.status}"}}
        )
    
    # Update caption/hashtags if provided
    if request.caption_override:
        reel.caption = request.caption_override
    if request.hashtags_override:
        reel.hashtags = request.hashtags_override
    
    reel.status = "posting"
    db.commit()
    
    # Enqueue publish task
    task = publish_reel.delay(reel.id)
    task_record = Task(task_id=task.id, reel_id=reel.id, type="publish", status="pending")
    db.add(task_record)
    db.commit()
    
    return PublishResponse(
        id=reel.id,
        status=reel.status,
        ig_task_id=f"igtask_{task.id}"
    )
