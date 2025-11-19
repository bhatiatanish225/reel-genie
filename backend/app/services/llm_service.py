from openai import OpenAI
from app.core.config import settings
import json
import logging

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    def generate_script(self, prompt: str, duration_seconds: int) -> dict:
        """
        Generate a script, caption, hashtags, and keywords for a reel
        """
        system_prompt = f"""You are a social media content creator specializing in short-form video content.
Generate a {duration_seconds}-second video script based on the user's prompt.

Return a JSON object with:
- script: The narration text (aim for ~{duration_seconds * 2.5} words)
- caption: An engaging Instagram caption (max 150 chars)
- hashtags: 5-10 relevant hashtags (as array)
- keywords: 3-5 keywords for finding stock footage (as array)

Make it engaging, concise, and optimized for social media."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.8
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            logger.info(f"Generated script for prompt: {prompt[:50]}...")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            # Fallback response
            return {
                "script": f"Here's an interesting fact about {prompt}. Stay tuned for more!",
                "caption": f"Learn about {prompt} 🎥",
                "hashtags": ["#viral", "#trending", "#fyp"],
                "keywords": prompt.split()[:3]
            }
        except Exception as e:
            logger.error(f"Error generating script: {e}")
            raise
