from celery import Task
from app.tasks.celery_app import celery_app
from app.db.base import SessionLocal
from app.models.reel import Reel
from app.models.task import Task as TaskModel
from app.models.analytics import Analytics
from app.services.instagram_service import InstagramService
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


class PublishTask(Task):
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 5}
    retry_backoff = True
    retry_backoff_max = 600
    retry_jitter = True


@celery_app.task(base=PublishTask, bind=True)
def publish_reel(self, reel_id: int):
    db = SessionLocal()
    
    try:
        reel = db.query(Reel).filter(Reel.id == reel_id).first()
        if not reel:
            logger.error(f"Reel {reel_id} not found")
            return
        
        if reel.status != "posting" and reel.status != "ready":
            logger.warning(f"Reel {reel_id} has invalid status for publishing: {reel.status}")
            return
        
        reel.status = "posting"
        db.commit()
        
        # Initialize Instagram service
        ig_service = InstagramService()
        
        # Publish to Instagram
        logger.info(f"Publishing reel {reel_id} to Instagram")
        ig_post_id = ig_service.publish_reel(
            video_url=reel.video_url,
            caption=reel.caption,
            hashtags=reel.hashtags
        )
        
        # Update reel
        reel.ig_post_id = ig_post_id
        reel.status = "posted"
        db.commit()
        
        # Log analytics event
        analytics = Analytics(
            reel_id=reel_id,
            event_type="posted",
            payload={"ig_post_id": ig_post_id, "posted_at": datetime.utcnow().isoformat()}
        )
        db.add(analytics)
        db.commit()
        
        logger.info(f"Successfully published reel {reel_id} to Instagram: {ig_post_id}")
        
        return {"status": "success", "ig_post_id": ig_post_id}
        
    except Exception as e:
        logger.error(f"Error publishing reel {reel_id}: {str(e)}")
        if reel:
            reel.status = "failed"
            db.commit()
        raise
    finally:
        db.close()
