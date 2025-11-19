from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.services.storage_service import StorageService
import tempfile
import os
import uuid

router = APIRouter()


@router.post("", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    allowed_types = ["video/mp4", "video/quicktime", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "invalid_file_type", "message": "Only video and image files are allowed"}}
        )
    
    # Save to temp file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
    
    try:
        content = await file.read()
        with open(temp_file.name, 'wb') as f:
            f.write(content)
        
        # Upload to S3
        upload_id = f"u_{uuid.uuid4().hex[:12]}"
        storage_service = StorageService()
        file_url = storage_service.upload_file(
            temp_file.name,
            f"uploads/{current_user.id}/{upload_id}{os.path.splitext(file.filename)[1]}"
        )
        
        return {
            "upload_id": upload_id,
            "file_url": file_url
        }
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
