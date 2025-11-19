from celery import Task
from app.tasks.celery_app import celery_app
from app.db.base import SessionLocal
from app.models.reel import Reel
from app.models.task import Task as TaskModel
from app.services.llm_service import LLMService
from app.services.tts_service import TTSService
from app.services.video_service import VideoService
from app.services.storage_service import StorageService
from app.services.thumbnail_service import ThumbnailService
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


class ReelGenerationTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        db = SessionLocal()
        try:
            reel_id = args[0]
            reel = db.query(Reel).filter(Reel.id == reel_id).first()
            if reel:
                reel.status = "failed"
                db.commit()
                
                task = db.query(TaskModel).filter(TaskModel.task_id == task_id).first()
                if task:
                    task.status = "failed"
                    logs = json.loads(task.logs) if task.logs else []
                    logs.append({
                        "ts": datetime.utcnow().isoformat(),
                        "level": "error",
                        "message": f"Task failed: {str(exc)}"
                    })
                    task.logs = json.dumps(logs)
                    db.commit()
        finally:
            db.close()


@celery_app.task(base=ReelGenerationTask, bind=True, max_retries=3)
def generate_reel(self, reel_id: int, post_now: bool = False):
    db = SessionLocal()
    
    try:
        reel = db.query(Reel).filter(Reel.id == reel_id).first()
        if not reel:
            logger.error(f"Reel {reel_id} not found")
            return
        
        # Update status
        reel.status = "generating"
        db.commit()
        
        # Initialize services
        llm_service = LLMService()
        tts_service = TTSService()
        video_service = VideoService()
        storage_service = StorageService()
        thumbnail_service = ThumbnailService()
        
        # Track task
        task_record = db.query(TaskModel).filter(TaskModel.task_id == self.request.id).first()
        
        def log_step(message: str, level: str = "info"):
            logger.info(f"Reel {reel_id}: {message}")
            if task_record:
                logs = json.loads(task_record.logs) if task_record.logs else []
                logs.append({
                    "ts": datetime.utcnow().isoformat(),
                    "level": level,
                    "message": message
                })
                task_record.logs = json.dumps(logs)
                db.commit()
        
        # Step 1: Generate script with LLM
        log_step("Generating script with LLM")
        script_data = llm_service.generate_script(
            prompt=reel.prompt,
            duration_seconds=reel.duration_seconds
        )
        reel.caption = script_data.get("caption", "")
        reel.hashtags = script_data.get("hashtags", [])
        db.commit()
        
        # Step 2: Generate voiceover with TTS
        log_step("Generating voiceover")
        audio_path = tts_service.generate_audio(
            text=script_data["script"],
            voice=reel.voice
        )
        
        # Step 3: Fetch stock clips
        log_step("Fetching stock footage")
        clips = video_service.fetch_stock_clips(
            keywords=script_data.get("keywords", []),
            duration=reel.duration_seconds
        )
        
        # Step 4: Assemble video
        log_step("Assembling video")
        video_path = video_service.assemble_video(
            clips=clips,
            audio_path=audio_path,
            duration=reel.duration_seconds,
            music_mood=reel.music_mood
        )
        
        # Step 5: Generate thumbnail
        log_step("Generating thumbnail")
        thumbnail_path = thumbnail_service.select_best_thumbnail(video_path)
        
        # Step 6: Upload to S3
        log_step("Uploading to S3")
        video_url = storage_service.upload_file(video_path, f"reels/{reel_id}.mp4")
        thumbnail_url = storage_service.upload_file(thumbnail_path, f"thumbs/{reel_id}.jpg")
        
        # Update reel
        reel.video_url = video_url
        reel.thumbnail_url = thumbnail_url
        reel.status = "ready"
        db.commit()
        
        log_step("Reel generation completed successfully")
        
        # If post_now, trigger publish
        if post_now:
            from app.tasks.publishing import publish_reel
            publish_reel.delay(reel_id)
        
        return {"status": "success", "reel_id": reel_id}
        
    except Exception as e:
        logger.error(f"Error generating reel {reel_id}: {str(e)}")
        if reel:
            reel.status = "failed"
            db.commit()
        raise
    finally:
        db.close()
