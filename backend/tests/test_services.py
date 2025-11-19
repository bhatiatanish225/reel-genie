import pytest
from unittest.mock import patch, MagicMock
from app.services.llm_service import LLMService
from app.services.thumbnail_service import ThumbnailService


def test_llm_service_generate_script():
    with patch('app.services.llm_service.OpenAI') as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"script": "Test script", "caption": "Test", "hashtags": ["#test"], "keywords": ["test"]}'
        mock_client.chat.completions.create.return_value = mock_response
        
        service = LLMService()
        result = service.generate_script("test prompt", 30)
        
        assert "script" in result
        assert "caption" in result
        assert "hashtags" in result
        assert "keywords" in result


def test_llm_service_handles_invalid_json():
    with patch('app.services.llm_service.OpenAI') as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = 'Invalid JSON'
        mock_client.chat.completions.create.return_value = mock_response
        
        service = LLMService()
        result = service.generate_script("test prompt", 30)
        
        # Should return fallback response
        assert "script" in result
        assert "caption" in result
