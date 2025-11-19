import requests
from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_videoclips, CompositeAudioClip
from app.core.config import settings
import tempfile
import os
import logging

logger = logging.getLogger(__name__)


class VideoService:
    def __init__(self):
        self.pexels_api_key = settings.PEXELS_API_KEY
        self.music_library = {
            "calm_upbeat": "https://example.com/music/calm_upbeat.mp3",
            "energetic": "https://example.com/music/energetic.mp3",
            "chill": "https://example.com/music/chill.mp3",
        }
    
    def fetch_stock_clips(self, keywords: list, duration: int) -> list:
        """
        Fetch stock video clips from Pexels based on keywords
        """
        clips = []
        
        try:
            for keyword in keywords[:3]:  # Limit to 3 keywords
                headers = {"Authorization": self.pexels_api_key}
                params = {
                    "query": keyword,
                    "per_page": 2,
                    "orientation": "portrait"
                }
                
                response = requests.get(
                    "https://api.pexels.com/videos/search",
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for video in data.get("videos", [])[:1]:
                        video_files = video.get("video_files", [])
                        # Get HD portrait video
                        for vf in video_files:
                            if vf.get("quality") == "hd" and vf.get("width", 0) < vf.get("height", 0):
                                clips.append(vf["link"])
                                break
            
            logger.info(f"Fetched {len(clips)} stock clips")
            return clips
            
        except Exception as e:
            logger.error(f"Error fetching stock clips: {e}")
            # Return empty list, will use placeholder
            return []
    
    def assemble_video(self, clips: list, audio_path: str, duration: int, music_mood: str = None) -> str:
        """
        Assemble final video from clips and audio
        """
        try:
            # Download clips
            clip_files = []
            for i, clip_url in enumerate(clips[:3]):
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
                response = requests.get(clip_url, stream=True)
                with open(temp_file.name, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                clip_files.append(temp_file.name)
            
            # Load video clips
            video_clips = []
            for clip_file in clip_files:
                clip = VideoFileClip(clip_file)
                video_clips.append(clip.subclip(0, min(clip.duration, duration / len(clip_files))))
            
            # Concatenate clips
            if video_clips:
                final_video = concatenate_videoclips(video_clips, method="compose")
            else:
                # Create placeholder black video
                from moviepy.editor import ColorClip
                final_video = ColorClip(size=(1080, 1920), color=(0, 0, 0), duration=duration)
            
            # Trim to exact duration
            final_video = final_video.subclip(0, min(final_video.duration, duration))
            
            # Load audio
            voice_audio = AudioFileClip(audio_path)
            
            # Mix with background music if specified
            if music_mood and music_mood in self.music_library:
                # TODO: Download and mix background music
                final_audio = voice_audio
            else:
                final_audio = voice_audio
            
            # Set audio
            final_video = final_video.set_audio(final_audio)
            
            # Export
            output_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
            final_video.write_videofile(
                output_file.name,
                codec="libx264",
                audio_codec="aac",
                fps=30,
                preset="medium"
            )
            
            # Cleanup
            for clip in video_clips:
                clip.close()
            final_video.close()
            voice_audio.close()
            
            logger.info(f"Video assembled: {output_file.name}")
            return output_file.name
            
        except Exception as e:
            logger.error(f"Error assembling video: {e}")
            raise
