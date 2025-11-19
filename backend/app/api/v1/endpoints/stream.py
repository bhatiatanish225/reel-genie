from fastapi import APIRouter, Depends, Query
from sse_starlette.sse import EventSourceResponse
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.db.base import SessionLocal
from app.models.reel import Reel
from app.models.task import Task
import asyncio
import json
from datetime import datetime

router = APIRouter()


@router.get("/stream")
async def stream_reel_updates(
    token: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    async def event_generator():
        last_check = datetime.utcnow()
        
        while True:
            db = SessionLocal()
            try:
                # Check for updated reels
                reels = db.query(Reel).filter(
                    Reel.user_id == current_user.id,
                    Reel.updated_at > last_check
                ).all()
                
                for reel in reels:
                    yield {
                        "event": "reel.status_update",
                        "data": json.dumps({
                            "type": "reel.status_update",
                            "payload": {
                                "id": reel.id,
                                "status": reel.status,
                                "ts": datetime.utcnow().isoformat()
                            }
                        })
                    }
                    
                    # Send logs if available
                    for task in reel.tasks:
                        if task.logs:
                            try:
                                logs = json.loads(task.logs)
                                for log in logs:
                                    yield {
                                        "event": "reel.log",
                                        "data": json.dumps({
                                            "type": "reel.log",
                                            "payload": {
                                                "reel_id": reel.id,
                                                **log
                                            }
                                        })
                                    }
                            except:
                                pass
                
                last_check = datetime.utcnow()
                
            finally:
                db.close()
            
            await asyncio.sleep(5)  # Poll every 5 seconds
    
    return EventSourceResponse(event_generator())
