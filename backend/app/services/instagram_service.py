import requests
import time
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class InstagramService:
    def __init__(self):
        self.access_token = settings.INSTAGRAM_ACCESS_TOKEN
        self.user_id = settings.INSTAGRAM_USER_ID
        self.base_url = "https://graph.facebook.com/v18.0"
    
    def publish_reel(self, video_url: str, caption: str, hashtags: list) -> str:
        """
        Publish a reel to Instagram using Graph API
        Returns the Instagram post ID
        """
        try:
            # Combine caption and hashtags
            full_caption = f"{caption}\n\n{' '.join(hashtags)}"
            
            # Step 1: Create media container
            logger.info("Creating Instagram media container")
            container_response = requests.post(
                f"{self.base_url}/{self.user_id}/media",
                params={
                    "media_type": "REELS",
                    "video_url": video_url,
                    "caption": full_caption,
                    "access_token": self.access_token
                }
            )
            
            if container_response.status_code != 200:
                raise Exception(f"Failed to create media container: {container_response.text}")
            
            container_id = container_response.json()["id"]
            logger.info(f"Media container created: {container_id}")
            
            # Step 2: Wait for processing
            max_attempts = 30
            for attempt in range(max_attempts):
                status_response = requests.get(
                    f"{self.base_url}/{container_id}",
                    params={
                        "fields": "status_code",
                        "access_token": self.access_token
                    }
                )
                
                status = status_response.json().get("status_code")
                logger.info(f"Container status: {status}")
                
                if status == "FINISHED":
                    break
                elif status == "ERROR":
                    raise Exception("Media processing failed")
                
                time.sleep(10)
            
            # Step 3: Publish media
            logger.info("Publishing media to Instagram")
            publish_response = requests.post(
                f"{self.base_url}/{self.user_id}/media_publish",
                params={
                    "creation_id": container_id,
                    "access_token": self.access_token
                }
            )
            
            if publish_response.status_code != 200:
                raise Exception(f"Failed to publish media: {publish_response.text}")
            
            post_id = publish_response.json()["id"]
            logger.info(f"Successfully published to Instagram: {post_id}")
            
            return post_id
            
        except Exception as e:
            logger.error(f"Error publishing to Instagram: {e}")
            raise
    
    def get_insights(self, post_id: str) -> dict:
        """
        Get insights for a published post
        """
        try:
            response = requests.get(
                f"{self.base_url}/{post_id}/insights",
                params={
                    "metric": "impressions,reach,likes,comments,shares,saves",
                    "access_token": self.access_token
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get insights: {response.text}")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting insights: {e}")
            return {}
