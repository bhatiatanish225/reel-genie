from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "reel_genie",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.generation",
        "app.tasks.publishing",
        "app.tasks.scheduled"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3300,  # 55 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

# Celery Beat schedule
celery_app.conf.beat_schedule = {
    "daily-autopost": {
        "task": "app.tasks.scheduled.daily_autopost",
        "schedule": crontab(hour=9, minute=0),  # 9 AM UTC daily
    },
}
