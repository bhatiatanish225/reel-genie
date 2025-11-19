from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.core.config import settings
import redis
import boto3

router = APIRouter()


@router.get("")
def health_check(db: Session = Depends(get_db)):
    services = {}
    
    # Check PostgreSQL
    try:
        db.execute("SELECT 1")
        services["postgres"] = "ok"
    except Exception as e:
        services["postgres"] = f"error: {str(e)}"
    
    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        services["redis"] = "ok"
    except Exception as e:
        services["redis"] = f"error: {str(e)}"
    
    # Check S3
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            endpoint_url=settings.S3_ENDPOINT_URL
        )
        s3.head_bucket(Bucket=settings.S3_BUCKET_NAME)
        services["s3"] = "ok"
    except Exception as e:
        services["s3"] = f"error: {str(e)}"
    
    # Overall status
    status = "ok" if all(v == "ok" for v in services.values()) else "degraded"
    
    return {
        "status": status,
        "services": services
    }
