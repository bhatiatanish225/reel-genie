from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from app.db.base import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.analytics import Analytics
from app.models.reel import Reel
from collections import Counter

router = APIRouter()


@router.get("")
def get_analytics(
    start: str = Query(..., description="Start date (ISO 8601)"),
    end: str = Query(..., description="End date (ISO 8601)"),
    metrics: str = Query("posts,engagement", description="Comma-separated metrics"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
    end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
    
    # Get reels in date range
    reels = db.query(Reel).filter(
        Reel.user_id == current_user.id,
        Reel.created_at >= start_date,
        Reel.created_at <= end_date
    ).all()
    
    # Get analytics events
    analytics_events = db.query(Analytics).join(Reel).filter(
        Reel.user_id == current_user.id,
        Analytics.created_at >= start_date,
        Analytics.created_at <= end_date
    ).all()
    
    # Calculate metrics
    total_posts = len([r for r in reels if r.status == "posted"])
    total_impressions = sum(
        event.payload.get("impressions", 0)
        for event in analytics_events
        if event.event_type == "ig_insights"
    )
    total_likes = sum(
        event.payload.get("likes", 0)
        for event in analytics_events
        if event.event_type == "ig_insights"
    )
    
    # Top hashtags
    all_hashtags = []
    for reel in reels:
        if reel.hashtags:
            all_hashtags.extend(reel.hashtags)
    
    hashtag_counts = Counter(all_hashtags)
    top_hashtags = [
        {"tag": tag, "count": count}
        for tag, count in hashtag_counts.most_common(10)
    ]
    
    # Timeseries data (daily aggregation)
    timeseries = []
    current_date = start_date
    while current_date <= end_date:
        next_date = current_date + timedelta(days=1)
        day_reels = [
            r for r in reels
            if current_date <= r.created_at < next_date
        ]
        timeseries.append({
            "date": current_date.isoformat(),
            "posts": len([r for r in day_reels if r.status == "posted"]),
            "generated": len(day_reels)
        })
        current_date = next_date
    
    return {
        "metrics": {
            "posts": total_posts,
            "total_impressions": total_impressions,
            "total_likes": total_likes
        },
        "timeseries": timeseries,
        "top_hashtags": top_hashtags
    }
