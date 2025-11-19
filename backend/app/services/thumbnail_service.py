import cv2
import numpy as np
from typing import List, Tuple
import tempfile
import logging

logger = logging.getLogger(__name__)


class ThumbnailService:
    def __init__(self):
        # Load face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
    
    def select_best_thumbnail(self, video_path: str, sample_interval: int = 1) -> str:
        """
        Select the best thumbnail from video frames
        Scores based on: face presence, sharpness, composition
        """
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            best_score = -1
            best_frame = None
            
            # Sample frames
            for i in range(0, frame_count, int(fps * sample_interval)):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                
                if not ret:
                    continue
                
                score = self._score_frame(frame)
                
                if score > best_score:
                    best_score = score
                    best_frame = frame.copy()
            
            cap.release()
            
            if best_frame is None:
                # Fallback to middle frame
                cap = cv2.VideoCapture(video_path)
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count // 2)
                ret, best_frame = cap.read()
                cap.release()
            
            # Save thumbnail
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            cv2.imwrite(temp_file.name, best_frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            logger.info(f"Selected thumbnail with score: {best_score}")
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Error selecting thumbnail: {e}")
            raise
    
    def _score_frame(self, frame: np.ndarray) -> float:
        """
        Score a frame based on multiple criteria
        """
        score = 0.0
        
        # 1. Face detection (significant boost)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        if len(faces) > 0:
            score += 50.0
        
        # 2. Sharpness (Laplacian variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        score += min(laplacian_var / 100, 30.0)
        
        # 3. Rule of thirds composition
        h, w = frame.shape[:2]
        center_region = frame[h//3:2*h//3, w//3:2*w//3]
        center_brightness = np.mean(center_region)
        score += min(center_brightness / 10, 20.0)
        
        return score
