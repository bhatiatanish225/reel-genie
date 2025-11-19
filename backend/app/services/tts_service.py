from elevenlabs import generate, save
from app.core.config import settings
import tempfile
import os
import logging

logger = logging.getLogger(__name__)


class TTSService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        
        # Voice mapping
        self.voice_map = {
            "female_alloy": "21m00Tcm4TlvDq8ikWAM",  # Rachel
            "male_echo": "pNInz6obpgDQGcFmaJgB",     # Adam
            "female_nova": "EXAVITQu4vr4xnSDxMaL",   # Bella
        }
    
    def generate_audio(self, text: str, voice: str) -> str:
        """
        Generate audio from text using ElevenLabs TTS
        Returns path to temporary audio file
        """
        try:
            voice_id = self.voice_map.get(voice, self.voice_map["female_alloy"])
            
            logger.info(f"Generating TTS audio with voice: {voice}")
            
            audio = generate(
                text=text,
                voice=voice_id,
                api_key=self.api_key,
                model="eleven_monolingual_v1"
            )
            
            # Save to temp file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
            save(audio, temp_file.name)
            
            logger.info(f"TTS audio saved to: {temp_file.name}")
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Error generating TTS audio: {e}")
            raise
