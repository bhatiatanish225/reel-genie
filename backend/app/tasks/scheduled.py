from app.tasks.celery_app import celery_app
from app.db.base import SessionLocal
from app.models.reel import Reel
from app.tasks.publishing import publish_reel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@celery_app.task
def daily_autopost():
    """
    Daily scheduled task to publish reels that are ready and scheduled for today
    """
    db = SessionLocal()
    
    try:
        now = datetime.utcnow()
        
        # Find reels that are ready and scheduled for now or past
        reels = db.query(Reel).filter(
            Reel.status == "ready",
            Reel.scheduled_time <= now
        ).all()
        
        logger.info(f"Found {len(reels)} reels scheduled for publishing")
        
        for reel in reels:
            logger.info(f"Queueing reel {reel.id} for publishing")
            publish_reel.delay(reel.id)
        
        return {"status": "success", "queued_count": len(reels)}
        
    except Exception as e:
        logger.error(f"Error in daily_autopost: {str(e)}")
        raise
    finally:
        db.close()
