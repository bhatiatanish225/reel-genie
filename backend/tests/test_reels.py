from unittest.mock import patch, MagicMock


def test_create_reel(client, auth_headers):
    with patch('app.tasks.generation.generate_reel.delay') as mock_task:
        mock_task.return_value = MagicMock(id="task_123")
        
        response = client.post(
            "/v1/reels",
            headers=auth_headers,
            json={
                "prompt": "financial tips for students",
                "duration_seconds": 30,
                "voice": "female_alloy",
                "music_mood": "calm_upbeat"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "queued"
        assert "id" in data
        assert mock_task.called


def test_create_reel_invalid_duration(client, auth_headers):
    response = client.post(
        "/v1/reels",
        headers=auth_headers,
        json={
            "prompt": "test prompt",
            "duration_seconds": 45,  # Invalid
            "voice": "female_alloy"
        }
    )
    assert response.status_code == 400


def test_list_reels(client, auth_headers, db, test_user):
    from app.models.reel import Reel
    
    # Create test reels
    for i in range(5):
        reel = Reel(
            user_id=test_user.id,
            prompt=f"Test prompt {i}",
            duration_seconds=30,
            voice="female_alloy",
            status="ready"
        )
        db.add(reel)
    db.commit()
    
    response = client.get("/v1/reels", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 5
    assert data["total"] == 5


def test_get_reel_detail(client, auth_headers, db, test_user):
    from app.models.reel import Reel
    
    reel = Reel(
        user_id=test_user.id,
        prompt="Test prompt",
        duration_seconds=30,
        voice="female_alloy",
        status="ready",
        caption="Test caption",
        hashtags=["#test", "#reel"]
    )
    db.add(reel)
    db.commit()
    
    response = client.get(f"/v1/reels/{reel.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == reel.id
    assert data["prompt"] == "Test prompt"
    assert data["caption"] == "Test caption"


def test_batch_create_reels(client, auth_headers):
    with patch('app.tasks.generation.generate_reel.delay') as mock_task:
        mock_task.return_value = MagicMock(id="task_123")
        
        response = client.post(
            "/v1/reels/batch",
            headers=auth_headers,
            json={
                "items": [
                    {"prompt": "Prompt 1", "duration_seconds": 15},
                    {"prompt": "Prompt 2", "duration_seconds": 30}
                ],
                "global_options": {"music_mood": "energetic"}
            }
        )
        
        assert response.status_code == 202
        data = response.json()
        assert data["created_count"] == 2
        assert len(data["items"]) == 2
